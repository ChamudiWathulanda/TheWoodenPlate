<?php

namespace App\Services;

use App\Models\Promotion;
use Illuminate\Support\Collection;

class PromotionEngine
{
    public function calculate(Collection $cartLines, ?\DateTimeInterface $now = null): array
    {
        $now = $now ? now()->setTimestamp($now->getTimestamp()) : now();
        $lines = $cartLines
            ->map(function (array $line) {
                $quantity = max(0, (int) ($line['quantity'] ?? 0));
                $unitPrice = round((float) ($line['unit_price'] ?? 0), 2);

                return [
                    'menu_item_id' => (int) ($line['menu_item_id'] ?? 0),
                    'name' => $line['name'] ?? 'Menu item',
                    'category_id' => $line['category_id'] ?? null,
                    'category_name' => $line['category_name'] ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_subtotal' => round($quantity * $unitPrice, 2),
                ];
            })
            ->filter(fn (array $line) => $line['menu_item_id'] > 0 && $line['quantity'] > 0)
            ->values();

        $subtotal = round($lines->sum('line_subtotal'), 2);
        if ($lines->isEmpty()) {
            return [
                'subtotal' => 0,
                'discount' => 0,
                'total' => 0,
                'applied_promotions' => [],
                'line_items' => [],
                'primary_promotion_id' => null,
            ];
        }

        $promotions = $this->activePromotions($now);

        $lineResults = $lines->map(function (array $line) use ($promotions) {
            $eligibleItemPromotions = $promotions
                ->filter(fn (Promotion $promotion) => $promotion->application_type === 'item' && $this->matchesTarget($promotion, $line))
                ->values();

            $eligibleBxgyPromotions = $promotions
                ->filter(fn (Promotion $promotion) => $promotion->application_type === 'bxgy' && $this->matchesTarget($promotion, $line))
                ->values();

            $best = null;

            foreach ($eligibleItemPromotions as $promotion) {
                $discount = $this->calculateDiscountAmount($promotion, $line['line_subtotal']);
                $best = $this->chooseBetterPromotion($best, $promotion, $discount, $line['line_subtotal']);
            }

            foreach ($eligibleBxgyPromotions as $promotion) {
                $discount = $this->calculateBxgyDiscount($promotion, $line);
                $best = $this->chooseBetterPromotion($best, $promotion, $discount, $line['line_subtotal']);
            }

            $discount = $best['discount'] ?? 0;

            return [
                ...$line,
                'discount' => $discount,
                'discounted_subtotal' => round(max(0, $line['line_subtotal'] - $discount), 2),
                'applied_promotion' => $best ? $this->formatAppliedPromotion($best['promotion'], $discount) : null,
            ];
        })->values();

        $orderPromotion = null;
        foreach ($promotions->where('application_type', 'order') as $promotion) {
            $eligibleBase = $lineResults
                ->filter(fn (array $line) => $this->matchesTarget($promotion, $line))
                ->sum('discounted_subtotal');

            if ($eligibleBase <= 0) {
                continue;
            }

            $discount = $this->calculateDiscountAmount($promotion, $eligibleBase);
            $candidate = [
                'promotion' => $promotion,
                'discount' => $discount,
                'eligible_base' => round($eligibleBase, 2),
            ];
            $orderPromotion = $this->chooseBetterAggregatePromotion($orderPromotion, $candidate);
        }

        $lineDiscount = round($lineResults->sum('discount'), 2);
        $orderDiscount = round($orderPromotion['discount'] ?? 0, 2);
        $totalDiscount = round($lineDiscount + $orderDiscount, 2);
        $total = round(max(0, $subtotal - $totalDiscount), 2);

        $appliedPromotions = collect($lineResults)
            ->pluck('applied_promotion')
            ->filter()
            ->values();

        if ($orderPromotion) {
            $appliedPromotions->push($this->formatAppliedPromotion($orderPromotion['promotion'], $orderPromotion['discount']));
        }

        $appliedPromotions = $appliedPromotions
            ->groupBy('promotion_id')
            ->map(function (Collection $group) {
                $first = $group->first();
                return [
                    ...$first,
                    'discount' => round($group->sum('discount'), 2),
                ];
            })
            ->sortByDesc('discount')
            ->values()
            ->all();

        return [
            'subtotal' => $subtotal,
            'discount' => $totalDiscount,
            'total' => $total,
            'applied_promotions' => $appliedPromotions,
            'line_items' => $lineResults->all(),
            'primary_promotion_id' => $appliedPromotions[0]['promotion_id'] ?? null,
        ];
    }

    private function activePromotions(\DateTimeInterface $now): Collection
    {
        $dayName = strtolower($now->format('l'));

        return Promotion::query()
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->orderByDesc('created_at')
            ->get()
            ->filter(function (Promotion $promotion) use ($dayName) {
                $days = collect($promotion->applicable_days ?? [])
                    ->map(fn ($day) => strtolower((string) $day))
                    ->filter()
                    ->values();

                return $days->isEmpty() || $days->contains($dayName);
            })
            ->values();
    }

    private function matchesTarget(Promotion $promotion, array $line): bool
    {
        $targetType = $promotion->target_type ?: 'all';
        $targets = collect($promotion->target_ids ?? [])->map(fn ($value) => (string) $value);

        if ($targetType === 'all' || $targets->isEmpty()) {
            return true;
        }

        if ($targetType === 'categories') {
            return $targets->contains((string) $line['category_id']);
        }

        if ($targetType === 'menu_items') {
            return $targets->contains((string) $line['menu_item_id']);
        }

        return false;
    }

    private function calculateDiscountAmount(Promotion $promotion, float $baseAmount): float
    {
        $baseAmount = max(0, $baseAmount);
        if ($baseAmount <= 0) {
            return 0;
        }

        $discount = $promotion->type === 'fixed'
            ? (float) $promotion->value
            : ($baseAmount * ((float) $promotion->value / 100));

        return round(min($discount, $baseAmount), 2);
    }

    private function calculateBxgyDiscount(Promotion $promotion, array $line): float
    {
        $buyQuantity = max(1, (int) ($promotion->buy_quantity ?? 1));
        $getQuantity = max(1, (int) ($promotion->get_quantity ?? 1));
        $groupSize = $buyQuantity + $getQuantity;

        if ($groupSize <= 0 || $line['quantity'] < $groupSize) {
            return 0;
        }

        $eligibleGroups = intdiv($line['quantity'], $groupSize);
        $freeItems = $eligibleGroups * $getQuantity;

        return round(min($line['line_subtotal'], $freeItems * $line['unit_price']), 2);
    }

    private function chooseBetterPromotion(?array $current, Promotion $promotion, float $discount, float $baseAmount): ?array
    {
        $discount = round(min($discount, $baseAmount), 2);
        if ($discount <= 0) {
            return $current;
        }

        if (!$current || $discount > $current['discount']) {
            return [
                'promotion' => $promotion,
                'discount' => $discount,
            ];
        }

        return $current;
    }

    private function chooseBetterAggregatePromotion(?array $current, array $candidate): ?array
    {
        if (($candidate['discount'] ?? 0) <= 0) {
            return $current;
        }

        if (!$current || $candidate['discount'] > $current['discount']) {
            return $candidate;
        }

        return $current;
    }

    private function formatAppliedPromotion(Promotion $promotion, float $discount): array
    {
        return [
            'promotion_id' => $promotion->id,
            'title' => $promotion->title,
            'application_type' => $promotion->application_type,
            'target_type' => $promotion->target_type,
            'discount' => round($discount, 2),
        ];
    }
}

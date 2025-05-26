import bisect
import numpy as np
import itertools


MAX_TEAM_SIZE = 15


def generate_bitmasks(n):
    masks = np.array(list(itertools.product([False, True], repeat=n)), dtype=np.bool)
    return np.flip(masks, axis=1)


def get_mask(mask, n):
    return [bool((mask >> i) & 1) for i in range(n)]


class Balancer:
    def __init__(self, max_team_size=MAX_TEAM_SIZE):
        assert max_team_size <= MAX_TEAM_SIZE, f"Max team size is {MAX_TEAM_SIZE}"
        self.masks = generate_bitmasks(max_team_size)

    def get_pairs(self, nums):
        masks = self.masks[: 1 << len(nums), : len(nums)]
        value_sum = (masks * nums).sum(axis=1) - (~masks * nums).sum(axis=1)
        mask_sum = masks.sum(axis=1)

        return zip(mask_sum, value_sum, np.arange(len(masks)))

    def find_solutions(self, nums):
        assert len(nums) > 1, "Number of players must be greater than 2"
        assert len(nums) % 2 == 0, "Number of players must be even"
        assert len(nums) <= 30, (
            f"Number of players must be no more than {2 * MAX_TEAM_SIZE}"
        )

        team_len = len(nums) // 2
        keys = [
            (team_len - mask_sum, -value_sum, mask)
            for mask_sum, value_sum, mask in self.get_pairs(nums[:team_len])
        ]
        keys.sort()

        min_diff = float("inf")
        solutions = []
        for mask_sum, value_sum, mask in self.get_pairs(nums[team_len:]):
            idx = bisect.bisect_left(keys, (mask_sum, value_sum, mask))
            if idx < len(keys) and keys[idx][0] == mask_sum:
                diff = abs(keys[idx][1] - value_sum)
                if diff == min_diff:
                    solutions.append((keys[idx][2], mask))
                elif diff < min_diff:
                    solutions = [(keys[idx][2], mask)]
                min_diff = min(min_diff, diff)

        return min_diff, [
            get_mask(half1, team_len) + get_mask(half2, team_len)
            for half1, half2 in solutions
        ]

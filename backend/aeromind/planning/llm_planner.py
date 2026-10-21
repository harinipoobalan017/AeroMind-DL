"""
Hierarchical LLM Mission Planner:
Translates natural-language human mission directives into structured
quantitative constraints and priority reward weights for the MAPPO swarm.
"""

import re
import json
from typing import Dict, Any

class LLMMissionPlanner:
    """
    High-Level Mission Interpreter:
    Bridges human operators with the Multi-Agent Deep RL coordinator.
    """
    def __init__(self):
        self.default_plan = {
            "mission_type": "SEARCH_AND_RESCUE",
            "priority_target": "PERSON",
            "priority_weights": {"PERSON": 1.5, "FIRE": 1.4, "BUILDING": 1.0, "ROAD_BLOCK": 0.8},
            "min_battery_reserve_pct": 20.0,
            "avoid_restricted_zones": True,
            "max_formation_speed": 8.0,
            "swarm_mode": "COOPERATIVE_MAPPO",
            "reasoning": "Standard emergency response: prioritize human survivors and active fire fronts."
        }

    def parse_natural_language_mission(self, user_prompt: str) -> Dict[str, Any]:
        """
        Parses human operator instructions like:
        'Search Sector A for survivors first and prioritize wildfire suppression. Keep 25% battery reserve.'
        """
        prompt_lower = user_prompt.lower()
        plan = dict(self.default_plan)
        reasoning_points = []

        # Target prioritization
        if "survivor" in prompt_lower or "people" in prompt_lower or "human" in prompt_lower:
            plan["priority_target"] = "PERSON"
            plan["priority_weights"]["PERSON"] = 2.5
            reasoning_points.append("Elevated survivor search priority weight to 2.5x.")

        if "fire" in prompt_lower or "wildfire" in prompt_lower or "hotspot" in prompt_lower:
            plan["priority_weights"]["FIRE"] = 2.2
            reasoning_points.append("Elevated wildfire boundary mapping priority weight to 2.2x.")

        if "building" in prompt_lower or "roof" in prompt_lower or "collapse" in prompt_lower or "structure" in prompt_lower:
            plan["priority_weights"]["BUILDING"] = 2.0
            reasoning_points.append("Prioritized structural collapse inspection.")

        # Battery reserve extraction
        battery_match = re.search(r"(\d+)\s*%\s*battery", prompt_lower)
        if battery_match:
            batt_val = float(battery_match.group(1))
            plan["min_battery_reserve_pct"] = max(10.0, min(50.0, batt_val))
            reasoning_points.append(f"Set return-to-base safety threshold to {plan['min_battery_reserve_pct']}% battery.")

        # Restricted zones
        if "avoid restricted" in prompt_lower or "no-fly" in prompt_lower or "toxic" in prompt_lower:
            plan["avoid_restricted_zones"] = True
            reasoning_points.append("Strict avoidance penalty applied for toxic/restricted airspace.")

        if "fast" in prompt_lower or "urgent" in prompt_lower or "emergency" in prompt_lower:
            plan["max_formation_speed"] = 10.0
            reasoning_points.append("Increased max drone transit speed to 10.0 m/s.")

        plan["reasoning"] = " | ".join(reasoning_points) if reasoning_points else "Interpreted general autonomous multi-drone patrol constraints."
        plan["raw_prompt"] = user_prompt
        return plan

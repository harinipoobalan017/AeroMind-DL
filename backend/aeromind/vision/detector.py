"""
Computer Vision & Object Detection Engine (YOLO / Vision Transformer)
Simulates on-board drone sensory perception, bounding box localization,
and camera-to-world coordinate transformation.
"""

import math
import random
from typing import Dict, List, Any, Optional

class DroneVisionDetector:
    """
    Simulates edge-computed YOLOv8 / ViT object detection from drone camera sensors.
    Transforms 2D sensor frame detections into 3D geo-referenced coordinates.
    """
    def __init__(self, fov_deg: float = 68.0, camera_resolution: tuple = (1920, 1080)):
        self.fov_deg = fov_deg
        self.fov_rad = math.radians(fov_deg)
        self.res_w, self.res_h = camera_resolution
        
        # Detection classes & confidence ranges
        self.classes = {
            "PERSON": {"label": "Human Survivor", "conf_min": 0.88, "conf_max": 0.99, "color": "#00FF66"},
            "FIRE": {"label": "Wildfire Hotspot", "conf_min": 0.91, "conf_max": 0.99, "color": "#FF3300"},
            "BUILDING": {"label": "Damaged Structure", "conf_min": 0.85, "conf_max": 0.97, "color": "#FFCC00"},
            "VEHICLE": {"label": "Stranded Vehicle", "conf_min": 0.89, "conf_max": 0.98, "color": "#00CCFF"},
            "OBSTACLE": {"label": "Air Hazard Obstacle", "conf_min": 0.92, "conf_max": 0.99, "color": "#FF00FF"}
        }

    def compute_ground_footprint(self, drone_pos: List[float], camera_pitch_deg: float = -45.0) -> float:
        """Calculates radius of camera footprint on the ground given altitude and pitch."""
        alt = max(2.0, drone_pos[2])
        footprint_radius = alt * math.tan(self.fov_rad / 2.0)
        return footprint_radius

    def scan_environment(
        self,
        drone: Dict[str, Any],
        targets: List[Dict[str, Any]],
        obstacles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Runs simulated neural network inference on objects within drone's camera FOV cone.
        Returns detected objects with 2D bounding boxes, confidence, and 3D projected coordinates.
        """
        if drone.get("status") == "CRITICAL_FAIL":
            return []

        drone_pos = drone["pos"]
        footprint_r = self.compute_ground_footprint(drone_pos)
        detections = []

        # Check targets in FOV cone
        for target in targets:
            dx = target["pos"][0] - drone_pos[0]
            dy = target["pos"][1] - drone_pos[1]
            dist_xy = math.hypot(dx, dy)

            # If inside vision cone
            if dist_xy <= footprint_r + 6.0:
                t_type = target["type"]
                class_meta = self.classes.get(t_type, self.classes["PERSON"])
                conf = round(random.uniform(class_meta["conf_min"], class_meta["conf_max"]), 3)

                # Simulated normalized 2D Bounding Box [ymin, xmin, ymax, xmax]
                # Center offset based on relative position
                norm_x = 0.5 + (dx / max(1.0, footprint_r)) * 0.4
                norm_y = 0.5 + (dy / max(1.0, footprint_r)) * 0.4
                norm_x = max(0.1, min(0.9, norm_x))
                norm_y = max(0.1, min(0.9, norm_y))
                
                box_w = random.uniform(0.12, 0.22)
                box_h = random.uniform(0.14, 0.26)

                bbox = [
                    round(max(0.02, norm_y - box_h / 2), 3),
                    round(max(0.02, norm_x - box_w / 2), 3),
                    round(min(0.98, norm_y + box_h / 2), 3),
                    round(min(0.98, norm_x + box_w / 2), 3)
                ]

                detections.append({
                    "class": t_type,
                    "label": class_meta["label"],
                    "confidence": conf,
                    "target_id": target["id"],
                    "bbox": bbox,
                    "color": class_meta["color"],
                    "gps_coord": list(target["pos"]),
                    "relative_distance_m": round(math.dist(drone_pos, target["pos"]), 1)
                })

        return detections

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function RestaurantPicker({ restaurants, value, onChange }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map(r => (
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    key={r.id}
                    onClick={() => onChange?.(r.id)}
                    className={`card p-4 text-left ${value === r.id ? "ring-2 ring-blue-200" : ""}`}
                >
                    <div className="font-medium">{r.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-neutral-600">
                        <MapPin className="size-4" /> {r.address || "—"}
                    </div>
                </motion.button>
            ))}
        </div>
    );
}

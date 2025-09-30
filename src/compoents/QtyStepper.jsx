import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function QtyStepper({ value = 0, onChange }) {
    const inc = () => onChange?.(value + 1);
    const dec = () => onChange?.(Math.max(0, value - 1));

    return (
        <div className="inline-flex items-center rounded-full border border-neutral-300 bg-white shadow-sm">
            <motion.button
                whileTap={{ scale: 0.92 }}
                className="px-3 h-9 text-neutral-700 disabled:opacity-50"
                onClick={dec}
                disabled={value <= 0}
            >
                <Minus className="size-4" />
            </motion.button>
            <div className="w-10 text-center tabular-nums">{value}</div>
            <motion.button
                whileTap={{ scale: 0.92 }}
                className="px-3 h-9 text-neutral-700"
                onClick={inc}
            >
                <Plus className="size-4" />
            </motion.button>
        </div>
    );
}

import QtyStepper from "./QtyStepper";
import { motion } from "framer-motion";

export default function DishGrid({ dishes = [], selections = {}, onChangeQty }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map(d => {
                const qty = selections[d.id] || 0;
                return (
                    <motion.div key={d.id} whileHover={{ y: -2 }} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="font-medium">{d.name}</div>
                                <div className="text-sm text-neutral-600">${d.price.toFixed(2)}</div>
                            </div>
                            <QtyStepper value={qty} onChange={(v) => onChangeQty(d.id, v)} />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Button({ children, className, variant = 'primary', ...rest }) {
    const base = 'btn ' + (variant === 'primary' ? 'btn-primary' : 'btn-ghost')
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={clsx(base, className)}
            {...rest}
        >
            {children}
        </motion.button>
    )
}

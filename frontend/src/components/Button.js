import React from 'react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    onClick,
    type = 'button',
    disabled = false,
    icon,
    ...props
}) => {
    return (
        <button
            type={type}
            className={`button button-${variant} button-${size}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

export default Button;

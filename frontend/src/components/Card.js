import React from 'react';
import './Card.css';

const Card = ({ children, className = '', compact = false, noHover = false }) => {
    return (
        <div className={`card ${compact ? 'card-compact' : ''} ${noHover ? 'card-no-hover' : ''} ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, title, subtitle }) => {
    return (
        <div className="card-header">
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
            {children}
        </div>
    );
};

export const CardBody = ({ children }) => {
    return <div className="card-body">{children}</div>;
};

export const CardFooter = ({ children }) => {
    return <div className="card-footer">{children}</div>;
};

export default Card;

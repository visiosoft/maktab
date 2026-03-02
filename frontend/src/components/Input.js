import React from 'react';
import './Input.css';

const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    icon,
    ...props
}) => {
    return (
        <div className="input-group">
            {label && (
                <label className={`input-label ${required ? 'required' : ''}`} htmlFor={name}>
                    {label}
                </label>
            )}
            <div className={icon ? 'input-icon' : ''}>
                {icon && <span className="input-icon-element">{icon}</span>}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`input-field ${error ? 'input-error' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export const TextArea = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    rows = 4,
    ...props
}) => {
    return (
        <div className="input-group">
            {label && (
                <label className={`input-label ${required ? 'required' : ''}`} htmlFor={name}>
                    {label}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export const Select = ({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    required = false,
    disabled = false,
    placeholder = 'Select an option',
    ...props
}) => {
    return (
        <div className="input-group">
            {label && (
                <label className={`input-label ${required ? 'required' : ''}`} htmlFor={name}>
                    {label}
                </label>
            )}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;

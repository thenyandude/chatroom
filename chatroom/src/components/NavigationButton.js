import React from 'react';
import { useNavigate } from 'react-router-dom';

function NavigationButton({ pathToNavigateTo, buttonText, className }) {
    const navigate = useNavigate();

    const handleNavigation = () => {
        navigate(pathToNavigateTo);
    };

    return (
        <button className={`button navigation-button ${className}`} onClick={handleNavigation}>
            {buttonText}
        </button>
    );
}

export default NavigationButton;

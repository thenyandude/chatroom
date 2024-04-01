import React from 'react';
import { useNavigate } from 'react-router-dom';

function NavigationButton({ pathToNavigateTo, buttonText }) {
    const navigate = useNavigate();

    const handleNavigation = () => {
        navigate(pathToNavigateTo);
    };

    return (
        <button onClick={handleNavigation}>{buttonText}</button>
    );
}

export default NavigationButton;

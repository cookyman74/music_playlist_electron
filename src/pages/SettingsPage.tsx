// src/pages/SettingsPage.tsx
import React from 'react';
import { Container } from '@mui/material';
import SettingsForm from "../components/Settings/SettingsForm";

const SettingsPage: React.FC = () => {
    return (
        <Container>
            <SettingsForm />
        </Container>
    );
};

export default SettingsPage;

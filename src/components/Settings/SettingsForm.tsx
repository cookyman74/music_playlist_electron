// src/pages/SettingsPage.tsx
import React from 'react';
import { Container, Button, Box } from '@mui/material';
import {setAccessToken} from "../../services/api";
import {CredentialResponse, GoogleLogin, GoogleOAuthProvider} from "@react-oauth/google";
// import { SpotifyOAuthProvider, SpotifyLogin } from 'react-oauth/spotify';

const SettingsPage: React.FC = () => {
    const handleGoogleLogin = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const token = credentialResponse.credential;
            setAccessToken(token);
            console.log("Google Login Success:", token);
        } else {
            console.error("Google Login Failed");
        }
    };

    const handleSpotifyLogin = (response: any) => {
        const token = response.headers.authorization; // auth 에서 받은 토큰
        setAccessToken(token);
        console.log("Spotify Login Success:", response);
        // 유저의 토큰을 저장하고 API에 접근할 수 있도록 설정
    };

    return (
        <Container>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={4}>
                {/* 구글 OAuth Provider */}
                <GoogleOAuthProvider clientId="962235731213-gprhadb3pk36tgbdk0tf7ak1m556ec7p.apps.googleusercontent.com">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => console.log("Google Login Failed")}
                    />
                </GoogleOAuthProvider>

                {/* 스포티파이 OAuth 버튼 */}
                <Button variant="contained" color="secondary" onClick={handleSpotifyLogin}>
                    스포티파이 계정 연동
                </Button>
            </Box>
        </Container>
    );
};

export default SettingsPage;

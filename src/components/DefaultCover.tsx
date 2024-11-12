import {Box} from "@mui/material";
import {LibraryMusic} from "@mui/icons-material";

interface DefaultCoverProps {
    width?: number | string;
    height?: number | string;
}

const DefaultCover: React.FC<DefaultCoverProps> = ({ width = '100%', height = '100%' }) => {
    return (
        <Box
            sx={{
                width,
                height,
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
            }}
        >
            <LibraryMusic
                sx={{
                    width: '50%',
                    height: '50%',
                    color: '#9e9e9e'
                }}
            />
        </Box>
    );
};

export default DefaultCover;

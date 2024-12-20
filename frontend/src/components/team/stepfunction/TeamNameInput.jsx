import React from 'react';
import {Box, Typography, InputLabel, Input, useTheme} from '@mui/material';

function TeamNameInput({ teamName, handleInputChange, teamNameError }) {
    const theme = useTheme();

    return (
        <Box sx={{ pt: 2, textAlign: 'center' }}>
            <Typography
                sx={{
                    mt: 4,
                    mb: 1,
                    fontSize: 'x-large',
                    fontWeight: 'bolder',
                    color: theme.palette.primary.main,
                }}
            >
                팀 이름 커스터마이즈하기
            </Typography>
            <Typography sx={{ mt: 2, mb: 8, fontSize: 'large' }}>
                개성있고 독특한 팀 이름을 지어보세요!
            </Typography>
            <InputLabel htmlFor="input-team-name" sx={{ mb: 1, textAlign: 'left', fontSize: 'medium' }}>
                팀 이름
            </InputLabel>
            <Input
                id="input-team-name"
                placeholder="당신과 함께할 팀 명은 무엇인가요?"
                aria-describedby="component-helper-text"
                fullWidth
                required
                value={teamName}
                onChange={handleInputChange}
            />
            {teamNameError && (
                <Typography color="error" sx={{ my: 2 }}>
                    {teamNameError}
                </Typography>
            )}
        </Box>
    );
}

export default TeamNameInput;
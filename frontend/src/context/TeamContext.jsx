import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {getTeamIdsAndNames} from "../utils/team/TeamApi.jsx";

const TeamsContext = createContext();

export const useTeams = () => useContext(TeamsContext);

const TeamsProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const teamProfiles = await getTeamIdsAndNames();
            setTeams(teamProfiles);
        } catch (error) {
            console.error("Error fetching teams:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTeams = useCallback((updatedTeam) => {
        setTeams((prevTeams) => {
            const teamExists = prevTeams.some((team) => team.PK === updatedTeam.PK);

            return teamExists
                ? prevTeams.map((team) =>
                    team.PK === updatedTeam.PK ? updatedTeam : team
                )
                : [updatedTeam, ...prevTeams];;
        });

        if (selectedTeam?.PK === updatedTeam.PK) {
            setSelectedTeam(updatedTeam);
        }
    }, [selectedTeam]);

    const updateSelectedTeam = useCallback((updatedTeam) => {
        setSelectedTeam(updatedTeam);
    }, []);

    // Provider 가 마운트될 때 자동 team fetch
    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);   // 함수 자체를 의존성으로 추가

    return (
        <TeamsContext.Provider
            value={{
                teams,
                selectedTeam,
                fetchTeams,
                updateTeams,
                updateSelectedTeam,
                loading,
            }}
        >
            {children}
        </TeamsContext.Provider>
    );
};

export default TeamsProvider;
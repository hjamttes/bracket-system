document.addEventListener('DOMContentLoaded', () => {
    const csvFile = document.getElementById('csvFile');
    const generateBtn = document.getElementById('generateBtn');
    const printBtn = document.getElementById('printBtn');
    const bracketDiv = document.getElementById('bracket');
    const divisionClassInput = document.getElementById('divisionClass');
    const teamCountSpan = document.getElementById('teamCount');
    const byeCountSpan = document.getElementById('byeCount');
    
    let tournamentData = {
        division: '',
        teams: []
    };
    
    csvFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const csvData = event.target.result;
            tournamentData = parseCSV(csvData);
            divisionClassInput.value = tournamentData.division;
        };
        
        reader.readAsText(file);
    });
    
    generateBtn.addEventListener('click', () => {
        if (tournamentData.teams.length === 0) {
            alert('Please upload CSV file first');
            return;
        }
        
        const tournamentName = document.getElementById('tournamentName').value;
        const tournamentDate = document.getElementById('tournamentDate').value;
        
        if (!tournamentName || !tournamentDate) {
            alert('Please fill in tournament name and date');
            return;
        }
        
        generateBracket(tournamentData.teams);
    });
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    function parseCSV(csvData) {
        const lines = csvData.split('\n');
        const data = {
            division: '',
            teams: []
        };
        
        // First line contains the division/class
        if (lines.length > 0) {
            data.division = lines[0].trim();
        }
        
        // Parse team data starting from second line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const teamInfo = line.split(',');
                if (teamInfo.length >= 1) {
                    data.teams.push({
                        teamName: teamInfo[0].trim(),
                        // If color is not specified, alternate between red and white
                        color: teamInfo[1] ? teamInfo[1].trim().toLowerCase() : 
                               (data.teams.length % 2 === 0 ? 'red' : 'white')
                    });
                }
            }
        }
        
        return data;
    }
    
    function generateBracket(teams) {
        // Calculate number of teams and byes
        const totalTeams = teams.length;
        let bracketSize = 2;
        while (bracketSize < totalTeams) {
            bracketSize *= 2;
        }
        
        const byes = bracketSize - totalTeams;
        
        // Update display counters
        teamCountSpan.textContent = totalTeams;
        byeCountSpan.textContent = byes;
        
        // Assign byes and create bracket structure
        const bracket = [];
        let byeCounter = 0;
        
        for (let i = 0; i < bracketSize / 2; i++) {
            const match = {
                team1: null,
                team2: null
            };
            
            if (i < totalTeams) {
                match.team1 = teams[i];
            } else {
                match.team1 = { teamName: 'BYE', color: 'none' };
                byeCounter++;
            }
            
            const opponent = bracketSize - 1 - i;
            if (opponent >= totalTeams) {
                match.team2 = { teamName: 'BYE', color: 'none' };
                byeCounter++;
            } else {
                match.team2 = teams[opponent];
            }
            
            bracket.push(match);
        }
        
        // Render bracket
        renderBracket(bracket);
        
        // Enable match result tracking
        enableMatchTracking();
    }
    
    function renderBracket(bracket) {
        bracketDiv.innerHTML = '';
        
        const rounds = Math.log2(bracket.length * 2);
        let matchesInRound = bracket.length;
        
        for (let round = 0; round < rounds; round++) {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round';
            
            for (let match = 0; match < matchesInRound; match++) {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'match';
                
                if (round === 0) {
                    // First round - use actual teams
                    const team1Div = createTeamDiv(bracket[match].team1, `${round}-${match}-1`);
                    const team2Div = createTeamDiv(bracket[match].team2, `${round}-${match}-2`);
                    
                    matchDiv.appendChild(team1Div);
                    matchDiv.appendChild(team2Div);
                } else {
                    // Subsequent rounds - empty slots
                    const slot1 = createTeamDiv({ teamName: '', color: 'none' }, `${round}-${match}-1`);
                    const slot2 = createTeamDiv({ teamName: '', color: 'none' }, `${round}-${match}-2`);
                    
                    matchDiv.appendChild(slot1);
                    matchDiv.appendChild(slot2);
                }
                
                roundDiv.appendChild(matchDiv);
            }
            
            bracketDiv.appendChild(roundDiv);
            matchesInRound /= 2;
        }
    }
    
    function createTeamDiv(team, id) {
        const teamDiv = document.createElement('div');
        teamDiv.className = `team ${team.color}`;
        teamDiv.textContent = team.teamName;
        teamDiv.dataset.teamId = id;
        teamDiv.draggable = true;
        return teamDiv;
    }
    
    function enableMatchTracking() {
        const teams = document.querySelectorAll('.team');
        
        teams.forEach(team => {
            team.addEventListener('click', function() {
                if (this.textContent && this.textContent !== 'BYE') {
                    const nextRound = this.closest('.round').nextElementSibling;
                    if (nextRound) {
                        const nextSlot = nextRound.querySelector('.team:empty');
                        if (nextSlot) {
                            nextSlot.textContent = this.textContent;
                            nextSlot.className = `team ${this.classList.contains('red') ? 'red' : 'white'}`;
                        }
                    }
                }
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('csvFile');
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
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'csv') {
            handleCSV(file);
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            handleExcel(file);
        }
    });
    
    function handleCSV(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const csvData = event.target.result;
            processFileData(csvData.split('\n').map(line => [line.trim()]));
        };
        reader.readAsText(file);
    }
    
    function handleExcel(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            processFileData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }
    
    function processFileData(data) {
        // Filter out empty rows
        data = data.filter(row => row.length > 0 && row[0]);
        
        // Try to find division/class information
        tournamentData.division = findDivision(data);
        
        // Get team names (skip header rows)
        tournamentData.teams = data
            .filter(row => {
                const cellValue = row[0].toString().toLowerCase();
                return !cellValue.includes('division') && 
                       !cellValue.includes('class') && 
                       !cellValue.includes('sparring') &&
                       cellValue !== tournamentData.division.toLowerCase();
            })
            .map((row, index) => ({
                teamName: row[0],
                color: index % 2 === 0 ? 'red' : 'white'
            }));
        
        // Update UI
        divisionClassInput.value = tournamentData.division;
        teamCountSpan.textContent = tournamentData.teams.length;
    }
    
    function findDivision(data) {
        // Look for division information in first few rows
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const cellValue = data[i][0].toString().toLowerCase();
            if (cellValue.includes('combat') || 
                cellValue.includes('traditional') || 
                cellValue.includes('sparring') ||
                cellValue.includes('jv') || 
                cellValue.includes('varsity')) {
                return data[i][0];
            }
        }
        return 'Division Not Found';
    }
    
    generateBtn.addEventListener('click', () => {
        if (tournamentData.teams.length === 0) {
            alert('Please upload file first');
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
    
    function generateBracket(teams) {
        // Calculate number of teams and byes
        const totalTeams = teams.length;
        let bracketSize = 2;
        while (bracketSize < totalTeams) {
            bracketSize *= 2;
        }
        
        const byes = bracketSize - totalTeams;
        byeCountSpan.textContent = byes;
        
        // Create bracket structure
        const bracket = [];
        
        for (let i = 0; i < bracketSize / 2; i++) {
            const match = {
                team1: null,
                team2: null
            };
            
            if (i < totalTeams) {
                match.team1 = teams[i];
            } else {
                match.team1 = { teamName: 'BYE', color: 'none' };
            }
            
            const opponent = bracketSize - 1 - i;
            if (opponent >= totalTeams) {
                match.team2 = { teamName: 'BYE', color: 'none' };
            } else {
                match.team2 = teams[opponent];
            }
            
            bracket.push(match);
        }
        
        renderBracket(bracket);
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
                    const team1Div = createTeamDiv(bracket[match].team1);
                    const team2Div = createTeamDiv(bracket[match].team2);
                    matchDiv.appendChild(team1Div);
                    matchDiv.appendChild(team2Div);
                } else {
                    const slot1 = createTeamDiv({ teamName: '', color: 'none' });
                    const slot2 = createTeamDiv({ teamName: '', color: 'none' });
                    matchDiv.appendChild(slot1);
                    matchDiv.appendChild(slot2);
                }
                
                roundDiv.appendChild(matchDiv);
            }
            
            bracketDiv.appendChild(roundDiv);
            matchesInRound /= 2;
        }
    }
    
    function createTeamDiv(team) {
        const teamDiv = document.createElement('div');
        teamDiv.className = `team ${team.color}`;
        teamDiv.textContent = team.teamName;
        return teamDiv;
    }
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
});

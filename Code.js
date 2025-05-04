// Existing doGet() remains unchanged
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Science_Question_Banks');
}

// New function to fetch login data from "• Login" sheet
function getLoginData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const loginSheet = spreadsheet.getSheetByName('• Login');
    
    if (!loginSheet) {
      throw new Error('Login sheet not found.');
    }

    const data = loginSheet.getDataRange().getValues();
    if (data.length < 1) {
      throw new Error('Login sheet is empty.');
    }

    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const loginData = [];

    // Ensure required headers exist
    if (!headers.includes('name') || !headers.includes('username') || !headers.includes('password')) {
      throw new Error('Login sheet must contain "Name", "Username", and "Password" headers.');
    }

    // Process each row starting from the second row (index 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => !cell)) continue; // Skip empty rows

      const userObj = {};
      headers.forEach((header, idx) => {
        userObj[header] = row[idx] ? row[idx].toString().trim() : '';
      });
      loginData.push(userObj);
    }

    Logger.log(`Retrieved ${loginData.length} login entries from • Login sheet`);
    return {
      headers: headers,
      loginData: loginData
    };
  } catch (e) {
    Logger.log(`Error in getLoginData: ${e.message}`);
    throw new Error('Failed to retrieve login data: ' + e.message);
  }
}

// Existing getQuestions() function (unchanged for now, but we’ll call it after login)
function getQuestions() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const questions = [];
    const sheetNames = [];
    const allHeaders = new Set();

    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (sheetName.includes('•')) return;
      sheetNames.push(sheetName);
      const data = sheet.getDataRange().getValues();
      if (data.length < 1) return;

      const headers = data[0].map(h => h.toString().toLowerCase().trim());
      if (!headers.includes('question')) return;

      headers.forEach(h => allHeaders.add(h));

      const choiceColumns = headers
        .map((h, i) => h.match(/^(choice|option)\s*\d+$/i) ? i : -1)
        .filter(i => i !== -1);

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.every(cell => !cell)) continue;

        const questionObj = { sheet: sheetName };
        headers.forEach((header, idx) => {
          let value = row[idx] ? row[idx].toString().trim() : '';
          if (header === 'grade' && /^\d+$/.test(value)) {
            value = `Grade ${value}`;
          }
          questionObj[header] = value;
        });

        if (choiceColumns.length > 0) {
          const choices = choiceColumns
            .map(idx => row[idx] ? row[idx].toString().trim() : '')
            .filter(c => c);
          questionObj.choices = choices.join(' | ');
        }

        questions.push(questionObj);
      }
    });

    Logger.log(`Retrieved ${questions.length} questions from ${sheetNames.length} sheets`);
    return {
      questions,
      sheetNames,
      headers: Array.from(allHeaders)
    };
  } catch (e) {
    Logger.log(`Error in getQuestions: ${e.message}`);
    throw new Error('Failed to retrieve questions. Please check spreadsheet access and format.');
  }
}
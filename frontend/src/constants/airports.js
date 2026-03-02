export const SAUDI_AIRPORTS = [
    { code: 'AHB', city: 'Abha', name: 'Abha International Airport', region: 'Asir' },
    { code: 'HOF', city: 'Al-Hofuf', name: 'Al-Ahsa International Airport', region: 'Eastern' },
    { code: 'ULH', city: 'al-Ula', name: 'Al-Ula International Airport', region: 'Medina' },
    { code: 'ELQ', city: 'Buraidah', name: 'Prince Naif bin Abdulaziz International Airport', region: 'Al-Qassim' },
    { code: 'DMM', city: 'Dammam', name: 'King Fahd International Airport', region: 'Eastern' },
    { code: 'JED', city: 'Jeddah', name: 'King Abdulaziz International Airport', region: 'Mecca' },
    { code: 'HAS', city: 'Ḥa\'il', name: 'Ha\'il International Airport', region: 'Ḥa\'il' },
    { code: 'MED', city: 'Medina', name: 'Prince Mohammad bin Abdulaziz International Airport', region: 'Medina' },
    { code: 'NUM', city: 'Neom', name: 'Neom Bay Airport', region: 'Tabuk' },
    { code: 'RUH', city: 'Riyadh', name: 'King Khalid International Airport', region: 'Riyadh' },
    { code: 'TIF', city: 'Taif', name: 'Taif International Airport', region: 'Mecca' },
    { code: 'AJF', city: 'Sakakah', name: 'Al-Jouf International Airport', region: 'Al-Jouf' },
    { code: 'YNB', city: 'Yanbu', name: 'Prince Abdul Mohsin Bin Abdulaziz International Airport', region: 'Medina' },
    { code: 'RSI', city: 'Hanak', name: 'Red Sea International Airport', region: 'Tabuk' },
    { code: 'GIZ', city: 'Jizan', name: 'King Abdullah bin Abdulaziz International Airport', region: 'Jazan' },
    { code: 'TUU', city: 'Tabuk', name: 'Prince Sultan bin Abdulaziz Airport', region: 'Tabuk' },
    { code: 'EAM', city: 'Najran', name: 'Najran Regional Airport', region: 'Najran' },
    { code: 'ABT', city: 'Al-Bahah', name: 'Al-Bahah Domestic Airport', region: 'Al-Bahah' },
    { code: 'EJH', city: 'Al-Wajh', name: 'Al-Wajh Domestic Airport', region: 'Tabuk' },
    { code: 'RAE', city: 'Arar', name: 'Arar Domestic Airport', region: 'Northern Borders' },
    { code: 'BHH', city: 'Bisha', name: 'Bisha Domestic Airport', region: 'Asir' },
    { code: 'DWD', city: 'Dawadmi', name: 'Dawadmi Domestic Airport', region: 'Riyadh' },
    { code: 'URY', city: 'Qurayyat', name: 'Gurayat Domestic Airport', region: 'Al-Jouf' },
    { code: 'QJB', city: 'Jubail', name: 'Jubail Airport', region: 'Eastern' },
    { code: 'AQI', city: 'Qaisumah, Hafar al-Batin', name: 'Al Qaisumah/Hafr Al Batin Airport', region: 'Eastern' },
    { code: 'RAH', city: 'Rafha', name: 'Rafha Domestic Airport', region: 'Northern Borders' },
    { code: 'SHW', city: 'Sharurah', name: 'Sharurah Domestic Airport', region: 'Najran' },
    { code: 'TUI', city: 'Turaif', name: 'Turaif Domestic Airport', region: 'Northern Borders' },
    { code: 'WAE', city: 'Wadi al-Dawasir', name: 'Wadi al-Dawasir Domestic Airport', region: 'Riyadh' }
];

export const getAirportLabel = (code) => {
    const airport = SAUDI_AIRPORTS.find(a => a.code === code);
    return airport ? `${airport.code} - ${airport.city} (${airport.name})` : code;
};

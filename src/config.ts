
type SportConfig = {
    sportId: number
    spreadsheetId: string
    sportTime: string
    locationId: number
};

const configs : SportConfig[] = [
    {
        sportId: 1,
        spreadsheetId: "116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs",
        sportTime: "11:30",
        locationId: 1
    },
    {
        sportId: 8,
        spreadsheetId: "1gFey8b2PHqI4p0NjKfqNWf0J1_Tk_2FniyxKGx6bU8E",
        sportTime: "11:45",
        locationId: 17
    }
];

export const CurrentConfig = configs[0];
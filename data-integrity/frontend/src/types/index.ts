export interface Award {
  internal_id: number;
  "Award ID": string;
  "Recipient Name": string;
  "Award Amount": number;
  "Total Outlays": number | null;
  Description: string;
  "Contract Award Type": string;
  "Recipient UEI": string;
  "Start Date": string;
  "End Date": string;
  "Awarding Agency": string;
  [key: string]: any;
}

export interface ApiResponse {
  spending_level: string;
  limit: number;
  results: Award[];
}

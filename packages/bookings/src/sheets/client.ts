import { sheets, type sheets_v4 } from "@googleapis/sheets";

/**
 * The slice of the Google Sheets API the booking adapter actually needs.
 *
 * This is the injectable seam: the adapter depends on this interface, the real
 * implementation wraps `@googleapis/sheets`, and tests pass an in-memory grid.
 * Per the project's testing rules, the real Sheets API is a true external
 * boundary — so we hand-write a fake of *this* contract instead of mocking the
 * Google client.
 */
export interface SheetsClient {
	/** Appends a single row to the end of a tab. */
	appendRow(tab: string, values: readonly string[]): Promise<void>;
	/** Every cell in a tab as strings, including the header row. */
	getValues(tab: string): Promise<string[][]>;
	/** Overwrites one row (1-based sheet row number) of a tab. */
	setRow(
		tab: string,
		rowNumber: number,
		values: readonly string[]
	): Promise<void>;
}

export interface GoogleSheetsClientOptions {
	/** An authenticated Google auth client (service account recommended). */
	auth: sheets_v4.Options["auth"];
	/** The spreadsheet id (from its URL). */
	spreadsheetId: string;
}

/** Real {@link SheetsClient} backed by the Google Sheets v4 API. */
export class GoogleSheetsClient implements SheetsClient {
	readonly #sheets: sheets_v4.Sheets;
	readonly #spreadsheetId: string;

	constructor(options: GoogleSheetsClientOptions) {
		this.#sheets = sheets({ version: "v4", auth: options.auth });
		this.#spreadsheetId = options.spreadsheetId;
	}

	async getValues(tab: string): Promise<string[][]> {
		const response = await this.#sheets.spreadsheets.values.get({
			spreadsheetId: this.#spreadsheetId,
			range: tab,
		});
		const values = response.data.values ?? [];
		return values.map((row) => row.map((value) => String(value ?? "")));
	}

	async appendRow(tab: string, values: readonly string[]): Promise<void> {
		await this.#sheets.spreadsheets.values.append({
			spreadsheetId: this.#spreadsheetId,
			range: tab,
			valueInputOption: "RAW",
			requestBody: { values: [[...values]] },
		});
	}

	async setRow(
		tab: string,
		rowNumber: number,
		values: readonly string[]
	): Promise<void> {
		await this.#sheets.spreadsheets.values.update({
			spreadsheetId: this.#spreadsheetId,
			range: `${tab}!A${rowNumber}`,
			valueInputOption: "RAW",
			requestBody: { values: [[...values]] },
		});
	}
}

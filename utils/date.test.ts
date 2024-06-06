import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { getLocales } from "react-native-localize";

import { getRelativeDate, getRelativeDateTime } from "./date";

jest.mock("react-native-localize", () => ({
  getLocales: jest.fn(),
}));

const mockLocaleEnUS = { languageCode: "en", countryCode: "US" };
const mockLocaleFrFR = { languageCode: "fr", countryCode: "FR" };

describe("getRelativeDateTime with en-US locale", () => {
  beforeAll(() => {
    (getLocales as jest.Mock).mockReturnValue([mockLocaleEnUS]);
  });

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDateTime()).toBe("");
  });

  it("should return time format if date is today", () => {
    const date = new Date();
    expect(getRelativeDateTime(date)).toBe(format(date, "p", { locale: enUS }));
  });

  it('should return "Yesterday" if date is one day ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    expect(getRelativeDateTime(date)).toBe("Yesterday");
  });

  it("should return day of the week if date is within the last 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    expect(getRelativeDateTime(date)).toBe(
      format(date, "EEEE", { locale: enUS })
    );
  });

  it("should return date in locale format if date is older than 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    expect(getRelativeDateTime(date)).toBe(format(date, "P", { locale: enUS }));
  });
});

describe("getRelativeDate with en-US locale", () => {
  beforeAll(() => {
    (getLocales as jest.Mock).mockReturnValue([mockLocaleEnUS]);
  });

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDate()).toBe("");
  });

  it('should return "Today" if date is today', () => {
    const date = new Date();
    expect(getRelativeDate(date)).toBe("Today");
  });

  it('should return "Yesterday" if date is one day ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    expect(getRelativeDate(date)).toBe("Yesterday");
  });

  it("should return day of the week if date is within the last 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    expect(getRelativeDate(date)).toBe(format(date, "EEEE", { locale: enUS }));
  });

  it("should return date in locale format if date is older than 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    expect(getRelativeDate(date)).toBe(format(date, "P", { locale: enUS }));
  });
});

describe("getRelativeDateTime with fr-FR locale", () => {
  beforeAll(() => {
    (getLocales as jest.Mock).mockReturnValue([mockLocaleFrFR]);
  });

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDateTime()).toBe("");
  });

  it("should return time format if date is today", () => {
    const date = new Date();
    expect(getRelativeDateTime(date)).toBe(format(date, "p", { locale: fr }));
  });

  it('should return "Yesterday" if date is one day ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    expect(getRelativeDateTime(date)).toBe("Yesterday");
  });

  it("should return day of the week if date is within the last 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    expect(getRelativeDateTime(date)).toBe(
      format(date, "EEEE", { locale: fr })
    );
  });

  it("should return date in locale format if date is older than 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    expect(getRelativeDateTime(date)).toBe(format(date, "P", { locale: fr }));
  });
});

describe("getRelativeDate with fr-FR locale", () => {
  beforeAll(() => {
    (getLocales as jest.Mock).mockReturnValue([mockLocaleFrFR]);
  });

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDate()).toBe("");
  });

  it('should return "Today" if date is today', () => {
    const date = new Date();
    expect(getRelativeDate(date)).toBe("Today");
  });

  it('should return "Yesterday" if date is one day ago', () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    expect(getRelativeDate(date)).toBe("Yesterday");
  });

  it("should return day of the week if date is within the last 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    expect(getRelativeDate(date)).toBe(format(date, "EEEE", { locale: fr }));
  });

  it("should return date in locale format if date is older than 7 days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    expect(getRelativeDate(date)).toBe(format(date, "P", { locale: fr }));
  });
});
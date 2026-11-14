import { describe, expect, it } from "vitest";
import { convert, currencyLabel, formatPrice, guessCurrency, parseEcbRates } from "@/lib/currency";

// ISC-85: approximate estimates from ECB reference rates (fixture in the feed's
// own format, rates from 2026-11-13).
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube><Cube time='2026-11-13'>
    <Cube currency='USD' rate='1.1052'/><Cube currency='GBP' rate='0.83559'/>
    <Cube currency='DKK' rate='7.4756'/><Cube currency='JPY' rate='176.83'/>
  </Cube></Cube>
</gesmes:Envelope>`;
const rates = parseEcbRates(XML);

describe("ECB rates", () => {
  it("parses the date and rates, with EUR as 1", () => {
    expect(rates).toEqual({ date: "2026-11-13", rates: { EUR: 1, USD: 1.1052, GBP: 0.83559, DKK: 7.4756, JPY: 176.83 } });
  });
  it("rejects a feed it doesn't recognise", () => {
    expect(() => parseEcbRates("<html>maintenance</html>")).toThrow();
  });
});

describe("convert", () => {
  it("matches price / rate(from) * rate(to) within 0.01", () => {
    expect(convert(8.5, "USD", "EUR", rates)).toBeCloseTo(8.5 / 1.1052, 2); // 7.69
    expect(convert(5.5, "EUR", "USD", rates)).toBeCloseTo(5.5 * 1.1052, 2); // 6.08
    expect(convert(50, "DKK", "GBP", rates)).toBeCloseTo((50 / 7.4756) * 0.83559, 2);
  });
  it("returns null for a currency the ECB doesn't publish", () => {
    expect(convert(10, "USD", "XYZ", rates)).toBeNull();
  });
});

describe("guessCurrency", () => {
  it("maps a browser language's region to its currency", () => {
    expect(guessCurrency(["en-GB"], rates)).toBe("GBP");
    expect(guessCurrency(["de-DE"], rates)).toBe("EUR");
    expect(guessCurrency(["da"], rates)).toBe("DKK"); // region filled in by Intl.Locale.maximize
  });
  it("skips regions without a published rate", () => {
    expect(guessCurrency(["en-AU", "en-US"], rates)).toBe("USD");
  });
});

describe("labels", () => {
  it("formats in the target currency and names currencies", () => {
    expect(formatPrice(7.69, "EUR")).toBe("€7.69 EUR");
    expect(currencyLabel("EUR")).toBe("EUR — Euro");
  });
});

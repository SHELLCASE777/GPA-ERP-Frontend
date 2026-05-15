// GPA-ERP V5.0 — Indonesian amount-in-words (terbilang)

const SATUAN = [
  "", "Satu", "Dua", "Tiga", "Empat", "Lima",
  "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh",
  "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas",
  "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas",
];

function ratusan(n: number): string {
  if (n === 0) return "";
  if (n < 20) return SATUAN[n];

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;

  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "Seratus" : `${SATUAN[hundreds]} Ratus`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(SATUAN[remainder]);
    } else {
      if (tens > 0) parts.push(`${SATUAN[tens]} Puluh`);
      if (ones > 0) parts.push(SATUAN[ones]);
    }
  }

  return parts.join(" ");
}

export function terbilang(amount: number): string {
  const n = Math.round(amount);

  if (n === 0) return "Nol Rupiah";

  const TRILIUN   = 1_000_000_000_000;
  const MILIAR    = 1_000_000_000;
  const JUTA      = 1_000_000;
  const RIBU      = 1_000;

  const parts: string[] = [];

  let remainder = n;

  const triliun = Math.floor(remainder / TRILIUN);
  if (triliun > 0) {
    parts.push(`${ratusan(triliun)} Triliun`);
    remainder %= TRILIUN;
  }

  const miliar = Math.floor(remainder / MILIAR);
  if (miliar > 0) {
    parts.push(`${ratusan(miliar)} Miliar`);
    remainder %= MILIAR;
  }

  const juta = Math.floor(remainder / JUTA);
  if (juta > 0) {
    parts.push(`${ratusan(juta)} Juta`);
    remainder %= JUTA;
  }

  const ribu = Math.floor(remainder / RIBU);
  if (ribu > 0) {
    parts.push(ribu === 1 ? "Seribu" : `${ratusan(ribu)} Ribu`);
    remainder %= RIBU;
  }

  if (remainder > 0) {
    parts.push(ratusan(remainder));
  }

  return `${parts.join(" ")} Rupiah`;
}

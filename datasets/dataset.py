#!/usr/bin/env python3
"""
Append a value to each entry in GeoNames-style countryInfo.txt.

- Preserves lines starting with '#'.
- Treats the first non-comment line as the header and adds a new column.
- By default appends the count of languages in the 'Languages' column.
- You can override with --value "SOMETHING" to append a constant instead.

Usage examples:
  python append_countryinfo.py countryInfo.txt
  python append_countryinfo.py countryInfo.txt --out countryInfo_out.txt
  python append_countryinfo.py countryInfo.txt --value ADDED --colname ExtraNote
"""

import argparse
import csv
import sys
from collections import defaultdict

def read_timezones(filepath="timeZones.txt"):
    """Reads timezones from the given file and returns a dictionary."""
    timezones = defaultdict(list)
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        try:
            header = next(reader)  # Skip header
        except StopIteration:
            return timezones # empty file
        for row in reader:
            if len(row) >= 2:
                country_code, timezone_id = row[0], row[2]
                timezones[country_code].append(timezone_id)
    return timezones

def main():
    p = argparse.ArgumentParser(description="Append a value to each entry in countryInfo.txt")
    p.add_argument("inp", help="Input file (e.g., countryInfo.txt)")
    p.add_argument("--out", default="countryInfo_out.txt", help="Output file (default: countryInfo_out.txt)")
    p.add_argument("--colname", default="TimeZones", help="Name of the new column (default: TimeZones)")
    p.add_argument("--timezones", default="timeZones.txt", help="Timezones file (default: timeZones.txt)")
    args = p.parse_args()

    timezones_data = read_timezones(args.timezones)
    header_written = False
    iso_code_idx = 0

    with open(args.inp, "r", encoding="utf-8", newline="") as fin, \
         open(args.out, "w", encoding="utf-8", newline="") as fout:

        writer = csv.writer(fout, delimiter="\t")

        for raw in fin:
            if not header_written:
                if raw.startswith("#ISO"):
                    fout.write(raw)
                    header = next(csv.reader([raw.lstrip("#")], delimiter="\t"))
                    writer.writerow(header + [args.colname])
                    header_written = True
                else:
                    fout.write(raw)
                continue

            if raw.startswith("#") or not raw.strip():
                fout.write(raw)
                continue

            row_reader = csv.reader([raw], delimiter="\t")
            try:
                row = next(row_reader)
            except StopIteration:
                continue

            if not row:
                continue

            if iso_code_idx < len(row):
                iso_code = row[iso_code_idx]
                country_timezones = timezones_data.get(iso_code, [])
                extra = ",".join(country_timezones)
            else:
                extra = ""

            writer.writerow(row + [extra])

    print(f"Done. Wrote: {args.out}")

if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        try:
            sys.stdout.close()
        except Exception:
            pass
        try:
            sys.stderr.close()
        except Exception:
            pass
            pass

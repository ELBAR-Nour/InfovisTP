import sys
import os

def main():
	try:
		import pandas as pd
	except Exception:
		print('pandas is required. Install with: pip install pandas')
		return 2

	import argparse
	parser = argparse.ArgumentParser(description='Check CSV for missing values')
	parser.add_argument('--file', '-f', default=os.path.join('data', 'healthcare_dataset.csv'), help='Path to CSV file')
	parser.add_argument('--export-missing', '-e', default=None, help='Path to export rows with missing values')
	parser.add_argument('--summary', '-s', action='store_true', help='Print a concise summary and exit')
	args = parser.parse_args()

	path = args.file
	if not os.path.exists(path):
		print(f'Dataset not found at {path}')
		return 3

	try:
		df = pd.read_csv(path)
	except Exception as e:
		print(f'Error reading CSV: {e}')
		return 4

	missing_per_col = df.isnull().sum()
	total_missing = int(missing_per_col.sum())
	rows_with_missing = int(df.isnull().any(axis=1).sum())

	if args.summary:
		cols = len(df.columns)
		rows = len(df)
		print(f'Rows: {rows} | Columns: {cols} | Total missing: {total_missing} | Rows with missing: {rows_with_missing}')
		if total_missing > 0:
			top_missing = missing_per_col[missing_per_col > 0].sort_values(ascending=False).head(5)
			print('Top missing columns:')
			print(top_missing)
		return 0

	if total_missing == 0:
		print('No missing values found.')
	else:
		print(f'Total missing values: {total_missing}')
		print('\nMissing values per column:')
		print(missing_per_col[missing_per_col > 0].sort_values(ascending=False))

		percent_missing = (df.isnull().mean() * 100).round(2)
		print('\nMissing percentage per column:')
		print(percent_missing[percent_missing > 0].sort_values(ascending=False))

		print(f'\nRows with at least one missing value: {rows_with_missing} / {len(df)}')

		if args.export_missing:
			missing_rows = df[df.isnull().any(axis=1)]
			try:
				missing_rows.to_csv(args.export_missing, index=False)
				print(f'Exported {len(missing_rows)} rows with missing values to {args.export_missing}')
			except Exception as e:
				print(f'Failed to export missing rows: {e}')

	return 0


if __name__ == '__main__':
	sys.exit(main())


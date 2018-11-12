import csv

accounts = {}

with open('../temp_reports/1539808292.csv', 'r') as csvfile:
    spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
    for row in spamreader:
        account = row[5]
        if account not in accounts:
            accounts[account] = True

print(len(accounts))

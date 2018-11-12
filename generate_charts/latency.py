import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import json
import csv

def sort_key(elem):
    return int(elem[0])

def generate_plot(file_name, n_gps, x0):
    with open('../temp_reports/{}.csv'.format(file_name), 'r') as csvfile:
        rows = []
        spamreader = csv.reader(csvfile, delimiter=',', quotechar='"')
        for row in spamreader:
            rows.append(row)
            # print(row)

        rows.sort(key=sort_key)

        i = 0

        x = []
        y = []

        for row in rows[x0:-1]:
            x.append(i)
            y.append(int(row[2]))
            i += 1

        fig, ax = plt.subplots()
        ax.plot(x, y)
        # ax.set_ylim(0, 200000)

        ax.set(xlabel='Indíce do Envio', ylabel='Latência em ms',
            title='Latência da requisição de envio do sinal GPS ({} dispositivos)'.format(n_gps))
        ax.grid()
        ax.axhline(y=1000, color='#00ee00')

        fig.savefig("latency_{}.png".format(file_name))
        plt.show()

generate_plot('8x1', 8, 100)
generate_plot('8x10', 80, 3050)
generate_plot('8x11', 88, 8000)
generate_plot('8x12', 96, 3500)
generate_plot('8x15', 120, 3800)

# def sort_key(elem):
#     return elem["idx"]

# with open('../persistent_reports/1538598275.json') as f:
#     report = json.load(f)

#     x = []
#     y = []

#     filterd_data = report["data"]
#     filterd_data.sort(key=sort_key)
#     filterd_data = [elem for elem in filterd_data if elem["status"] == "OK"]

#     for tx in report["data"]:
#         x.append(tx["idx"])
#         y.append(tx["latency"])

#     print(x)
#     print(y)

#     fig, ax = plt.subplots()
#     ax.plot(x, y)
#     # ax.set_ylim(0, 200000)

#     ax.set(xlabel='X', ylabel='Y',
#         title='Title')
#     ax.grid()

#     fig.savefig("letency.png")
#     plt.show()

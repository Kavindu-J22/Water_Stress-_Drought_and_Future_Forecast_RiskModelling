#!/usr/bin/env python3
"""Smoke-test the simulated data package; no external research validation implied."""
import csv,gzip,json,math,collections,hashlib
from pathlib import Path
from datetime import datetime,timedelta
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dataset'

def csv_rows(p):
    with open(p,newline='',encoding='utf-8') as f:
        yield from csv.DictReader(f)

n=0; dups=set(); daily_sum=collections.defaultdict(float); bad=collections.Counter(); months=collections.Counter()
with gzip.open(D/'environmental_daily.csv.gz','rt',newline='',encoding='utf-8') as f:
    for row in csv.DictReader(f):
        n+=1;key=(row['location_id'],row['date']); assert key not in dups, f'duplicate daily: {key}'; dups.add(key)
        assert row['is_synthetic']=='1' and row['data_origin']=='SYNTHETIC_SIMULATION'
        r=float(row['rainfall_mm']);t=float(row['temperature_c']);rh=float(row['relative_humidity_pct']);
        sw=float(row['soil_moisture_m3m3']);dw=float(row['dewpoint_c']);sol=float(row['solar_radiation_mj_m2'])
        assert 0<=r<=241 and 15<t<42 and 0<=rh<=100 and 0.05<=sw<=.49 and dw<=t and 5<sol<30
        daily_sum[(row['location_id'],row['date'][:7])]+=r
assert n==525952,n
print('PASS: daily row count, date keys, valid numerical ranges, provenance')
allrows=list(csv_rows(D/'monthly_reference_1981_2025.csv'))
assert len(allrows)==17280
assert len({(r['location_id'],r['forecast_issue_month']) for r in allrows})==17280
for r in allrows:
    assert abs(daily_sum[(r['location_id'],r['forecast_issue_month'])]-float(r['rainfall_monthly_mm'])) < .028
    if r['spi_3']:
        spi=float(r['spi_3']);cat='Critical' if spi<=-1.5 else 'High' if spi<=-1 else 'Medium' if spi<=-.5 else 'Low'
        assert cat==r['risk_current']
print('PASS: monthly sum matches raw daily records and consistent risk categories')
ml=list(csv_rows(D/'drought_monthly_ml.csv'))
assert len(ml)==9600
expected={1:[],3:[],6:[]}
for r in ml:
    ym=r['forecast_issue_month']; assert 2001<=int(ym[:4])<=2025
    assert r['is_synthetic']=='1'
    for h in (1,3,6):
        target=r[f'target_month_h{h}'];a=r[f'target_spi3_h{h}'];split=r[f'split_h{h}']
        if target:
            ti=int(ym[:4])*12+int(ym[5:])+h-1
            assert target==f'{ti//12:04d}-{ti%12+1:02d}'
            assert a!=''
            assert split==('TRAIN' if int(target[:4])<=2020 else 'VALIDATION' if int(target[:4])<=2022 else 'TEST')
        else:
            assert a=='' and split=='UNLABELED'
    assert r['target_spi3_h1']!='' or ym=='2025-12'
print('PASS: h1/h3/h6 future labels, target-month partitioning, empty unknown future targets')
for h in (1,3,6):
    for split in ('train','validation','test'):
        subset=list(csv_rows(ROOT/'model_ready'/f'{split}_h{h}.csv'))
        assert all(r[f'split_h{h}']==split.upper() for r in subset)
        assert all(r[f'target_spi3_h{h}']!='' for r in subset)
        expected[h].append((split,len(subset)))
print('PASS: training partitions strictly follow future target periods')
mapobj=json.loads((D/'coconut_grid.geojson').read_text())
assert len(mapobj['features'])==32
assert all(f['properties']['geometry_is_surveyed_coconut_plantation'] is False for f in mapobj['features'])
print('PASS: synthetic map disclaimer on every illustrative location')
classes=collections.Counter(r['risk_current'] for r in ml)
metrics=list(csv_rows(D/'baseline_evaluation.csv'))
assert len(metrics)==6
summary={'status':'PASS','synthetic_data_only':True,'daily_records':n,'reference_monthly_records':len(allrows),
 'ml_monthly_records':len(ml),'locations':32,'risk_class_counts':dict(classes),
 'split_counts':{str(k):v for k,v in expected.items()},
 'baseline_metrics':metrics,'checks':['schema','uniqueness','range','provenance','daily-monthly-reconciliation','spi risk thresholds',
 'future target alignment','target-date split','geojson is illustrative']}
(ROOT/'documentation'/'DATA_QUALITY_REPORT.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
md=['# Synthetic Dataset Quality Report','','**RESULT: PASS — automated structural checks only.**','',
'> These checks do not establish correctness of real climate records or plantation drought predictions. Every observation is simulated.',
'',f'- Daily rows: **{n:,}**',f'- Historical monthly rows: **{len(allrows):,}**',f'- Forecasting monthly rows: **{len(ml):,}**',
'- Illustrative Sri Lanka locations: **32**','- Climate simulation history: **1981–2025**','- SPI climatology: **synthetic 1981–2010**',
'- Forecast horizons: **1, 3, 6 months**','- Numerical ranges and date uniqueness: **PASS**',
'- Daily-to-monthly rainfall reconciliation: **PASS**',
'- Target-month chronological split and missing future labels: **PASS**','',
'## Current-risk class distribution in model-ready dataset','', '| Risk class | Records |','|---|---:|']
md.extend(f'| {k} | {v:,} |' for k,v in sorted(classes.items()))
md.extend(['','## Actual test-baseline metrics computed on *synthetic* data','','| Horizon | Algorithm | N | MAE | RMSE |','|---:|---|---:|---:|---:|'])
for x in metrics:md.append(f"| {x['horizon_months']} | {x['model']} | {x['test_sample_count']} | {x['mae']} | {x['rmse']} |")
md.extend(['','## Exclusions and limitations','',
'- No real CHIRPS, NASA POWER, ERA5-Land, CRI, weather-station or field-stress observations are present.',
'- The synthetic `coconut_grid.geojson` uses illustrative rectangles near selected towns, not mapped plantations.',
'- PET and soil moisture are simulated proxies, not measured physiological or physical quantities.',
'- SPI fits and evaluation metrics assess simulation behavior, not observed Sri Lankan drought forecasting skill.',
'- Deep learning / ML models have **not yet been trained** in this kit. The master prompt instructs your coding agent to implement and train them.',
'- Complete responsive frontend and functioning live backend are **not included yet**; the master prompt specifies their implementation.',''])
(ROOT/'documentation'/'DATA_QUALITY_REPORT.md').write_text('\n'.join(md),encoding='utf-8')
print(json.dumps(summary,indent=2)[:1900])

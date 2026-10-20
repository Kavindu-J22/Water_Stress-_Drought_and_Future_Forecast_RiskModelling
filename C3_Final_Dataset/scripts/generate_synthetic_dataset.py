#!/usr/bin/env python3
"""Reproducible DEMONSTRATION-ONLY C3 environmental series, NOT observed weather.

Purpose: integration, debugging, model development on simulated dynamics. Dataset is not
validated as Sri Lankan climate measurements, plantation stress, or coconut cultivation mapping.
Dependencies: numpy, scipy; standard Python csv/gzip/json.
"""
from __future__ import annotations
import csv, gzip, json, math, hashlib, calendar
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
from collections import defaultdict
import numpy as np
from scipy.stats import gamma, norm

BASE=Path(__file__).resolve().parents[1]
DATA=BASE/'dataset'; MODEL=BASE/'model_ready'
DATA.mkdir(exist_ok=True,parents=True);MODEL.mkdir(exist_ok=True,parents=True)
SEED=20261020
rng=np.random.default_rng(SEED)
# Approximate illustrative town points, NOT confirmed coconut fields or survey coordinates.
# location_id, town, district, province, lat, lon, normal monthly rain multiplier, climate zone
SITES=[
 ('C3_001','Negombo','Gampaha','Western',7.2083,79.8358,1.07,'SW'),
 ('C3_002','Minuwangoda','Gampaha','Western',7.1667,79.9500,1.12,'SW'),
 ('C3_003','Kurunegala','Kurunegala','North Western',7.4863,80.3647,1.04,'TRANS'),
 ('C3_004','Kuliyapitiya','Kurunegala','North Western',7.4690,80.0460,1.01,'SW'),
 ('C3_005','Pannala','Kurunegala','North Western',7.3284,79.9928,1.04,'SW'),
 ('C3_006','Chilaw','Puttalam','North Western',7.5764,79.7956,.96,'TRANS'),
 ('C3_007','Puttalam','Puttalam','North Western',8.0408,79.8394,.77,'DRY'),
 ('C3_008','Kaduwela','Colombo','Western',6.9331,79.9824,1.16,'SW'),
 ('C3_009','Kalutara','Kalutara','Western',6.5854,79.9607,1.24,'SW'),
 ('C3_010','Horana','Kalutara','Western',6.7150,80.0620,1.30,'SW'),
 ('C3_011','Kegalle','Kegalle','Sabaragamuwa',7.2513,80.3464,1.24,'SW'),
 ('C3_012','Mawanella','Kegalle','Sabaragamuwa',7.2539,80.4465,1.14,'SW'),
 ('C3_013','Ratnapura','Ratnapura','Sabaragamuwa',6.6828,80.3992,1.47,'SW'),
 ('C3_014','Embilipitiya','Ratnapura','Sabaragamuwa',6.3439,80.8492,.81,'TRANS'),
 ('C3_015','Galle','Galle','Southern',6.0535,80.2210,1.24,'SW'),
 ('C3_016','Elpitiya','Galle','Southern',6.2920,80.1610,1.29,'SW'),
 ('C3_017','Matara','Matara','Southern',5.9549,80.5550,1.13,'SW'),
 ('C3_018','Akuressa','Matara','Southern',6.1016,80.4803,1.31,'SW'),
 ('C3_019','Tangalle','Hambantota','Southern',6.0240,80.7920,.83,'TRANS'),
 ('C3_020','Anuradhapura','Anuradhapura','North Central',8.3114,80.4037,.76,'DRY'),
 ('C3_021','Kekirawa','Anuradhapura','North Central',8.0380,80.5980,.79,'DRY'),
 ('C3_022','Polonnaruwa','Polonnaruwa','North Central',7.9403,81.0188,.81,'NE'),
 ('C3_023','Trincomalee','Trincomalee','Eastern',8.5874,81.2152,.87,'NE'),
 ('C3_024','Batticaloa','Batticaloa','Eastern',7.7102,81.6924,.93,'NE'),
 ('C3_025','Ampara','Ampara','Eastern',7.2975,81.6747,.83,'NE'),
 ('C3_026','Dambulla','Matale','Central',7.8742,80.6511,.84,'TRANS'),
 ('C3_027','Kandy','Kandy','Central',7.2906,80.6337,1.13,'SW'),
 ('C3_028','Mahiyanganaya','Badulla','Uva',7.3200,81.0000,.76,'NE'),
 ('C3_029','Monaragala','Monaragala','Uva',6.8728,81.3507,.78,'TRANS'),
 ('C3_030','Jaffna','Jaffna','Northern',9.6615,80.0255,.66,'NE'),
 ('C3_031','Mannar','Mannar','Northern',8.9770,79.9044,.66,'DRY'),
 ('C3_032','Vavuniya','Vavuniya','Northern',8.7514,80.4971,.73,'DRY')]

def winter_month_factor(m):return math.exp(-.5*((min(abs(m-12),abs(m-0),abs(m-13)))/2.0)**2)

def monthly_factor(m,zone):
    sw = (1.16 if m in (5,6,7,8,9) else .74) + (.43 if m in (10,11) else 0)
    ne = (1.64 if m in (10,11,12,1,2) else .56) + (.12 if m in (3,4) else 0)
    return {'SW':sw,'NE':ne,'DRY':.68*ne+.32*sw,'TRANS':.54*sw+.46*ne}[zone]

def band(spi):
    if spi is None or not np.isfinite(spi):return ''
    if spi <= -1.5: return 'Critical'
    if spi <= -1.0: return 'High'
    if spi <= -0.5: return 'Medium'
    return 'Low'

def partition(ym):
    y=int(ym[:4]); return 'TRAIN' if 2001<=y<=2020 else 'VALIDATION' if y<=2022 and y>=2021 else 'TEST' if 2023<=y<=2025 else 'REFERENCE_ONLY'

def month_add(ym,n):
    y,m=map(int,ym.split('-'));k=y*12+m-1+n;return f'{k//12:04d}-{k%12+1:02d}'

def gamma_spi(series,scale):
    """Month-of-year zero-adjusted Gamma SPI; 1981-2010 reference, 30 estimates/mo."""
    n=len(series); roll=np.full(n,np.nan); vals=np.asarray(series,dtype=float)
    for i in range(scale-1,n):roll[i]=vals[i-scale+1:i+1].sum()
    transformed=np.full(n,np.nan)
    params=[]
    for month in range(1,13):
        ref=np.array([roll[i] for i in range(n) if 1981<=1981+i//12<=2010 and (i%12+1)==month and np.isfinite(roll[i])])
        nonzero=ref[ref>0]
        if len(ref)<25 or len(nonzero)<10 or np.std(nonzero)<1e-8:
            raise ValueError(f'Insufficient synthetic climatology: month={month}, scale={scale}')
        shape, _, size=gamma.fit(nonzero,floc=0)
        qzero=float(np.mean(ref==0))
        for i in range(n):
            if i%12+1==month and np.isfinite(roll[i]):
                prob=qzero+(1-qzero)*gamma.cdf(max(0,roll[i]),shape,loc=0,scale=size)
                transformed[i]=float(norm.ppf(np.clip(prob,1e-7,1-1e-7)))
        params.append({'scale_months':scale,'calendar_month':month,'reference_years':'1981-2010','n_reference':len(ref),
                       'gamma_shape':round(float(shape),8),'gamma_scale':round(float(size),8),'zero_probability':round(qzero,6)})
    return transformed,params

def save_csv(path,rows,cols):
    with open(path,'w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore');w.writeheader();w.writerows(rows)

def generate():
    dt0=date(1981,1,1); dt1=date(2025,12,31)
    dates=np.arange((dt1-dt0).days+1)
    dts=[dt0+timedelta(days=int(d)) for d in dates]
    years=np.array([x.year for x in dts]); months=np.array([x.month for x in dts]); unique_ym=sorted(set(x.strftime('%Y-%m') for x in dts))
    ym_index={m:i for i,m in enumerate(unique_ym)}
    ym_for_day=np.array([ym_index[d.strftime('%Y-%m')] for d in dts])
    # Shared climate anomalies + region-specific AR(1) weather anomalies: synthetic, not fitted to observations.
    common=np.zeros(len(unique_ym)); region=np.zeros(len(unique_ym))
    for i in range(1,len(unique_ym)):
        common[i]=.74*common[i-1]+rng.normal(0,.47)
        region[i]=.61*region[i-1]+rng.normal(0,.39)
    daily_cols=['date','location_id','location_name','district','province','latitude','longitude',
                'rainfall_mm','temperature_c','relative_humidity_pct','dewpoint_c','solar_radiation_mj_m2',
                'pet_proxy_mm','soil_moisture_m3m3','water_balance_proxy_mm','is_synthetic','data_origin']
    raw_path=DATA/'environmental_daily.csv.gz'
    monthly_all=[]; fits=[]; preview=[]
    with gzip.open(raw_path,'wt',newline='',encoding='utf-8',compresslevel=6) as gz:
        writer=csv.writer(gz); writer.writerow(daily_cols)
        for j,(sid,town,district,province,lat,lon,mult,zone) in enumerate(SITES):
            local_rng=np.random.default_rng(SEED+19*j)
            site_shock=np.zeros(len(unique_ym))
            for i in range(1,len(unique_ym)):
                site_shock[i]=.58*site_shock[i-1]+local_rng.normal(0,.36)
            monthly_logs=.30*common+.19*region+ .25*site_shock
            intensity=np.maximum(.38,np.exp(np.clip(monthly_logs,-1.05,1.00)))
            factors=np.array([monthly_factor(m,zone) for m in months])
            mean_day=4.4*mult*factors*intensity[ym_for_day]
            wet_p=np.clip(.28 + .032*mean_day, .18,.73)
            wet=(local_rng.random(len(dates))<wet_p)
            rainfall=np.where(wet,local_rng.gamma(shape=1.55,scale=mean_day/(wet_p*1.55)),0.0)
            rainfall=np.minimum(rainfall,240.0)
            # Dry spells persist because rainfall is Bernoulli with site/month varying wet probability.
            base_temp=27.3 +(.65 if zone in ('DRY','NE') else -.4) -(1.5 if town=='Kandy' else 0)
            temp=np.clip(base_temp+ .8*np.cos(2*np.pi*(months-4)/12)
                    + .34*np.arange(len(dates))/(365.25*45) + local_rng.normal(0,1.32,len(dates))
                    - .16*np.clip(rainfall/25,0,3),18.2,39.5)
            hum=np.clip(73 + 2.15*(mean_day-4)-.9*(temp-27)+
                        7*(rainfall>0)+local_rng.normal(0,5.8,len(dates)),38,99)
            # Magnus formula yields physically consistent dewpoint < temperature.
            g=np.log(hum/100)+(17.625*temp)/(243.04+temp)
            dew=243.04*g/(17.625-g)
            solar=np.clip(20.3 - .095*hum-1.12*(rainfall>0)+.45*(temp-27)+local_rng.normal(0,1.4,len(dates))+8,
                          6,28)
            # PET is DEMONSTRATION-ONLY heuristic (NOT Penman-Monteith ET0).
            pet=np.clip(2.1+.19*(temp-22)+.075*(solar-14)+.027*(100-hum),1.4,8.2)
            wb=rainfall-pet
            soil=np.empty(len(dates),dtype=float);s=.30
            for i in range(len(dates)):
                # Simple non-calibrated bucket proxy, not field-measured volumetric water.
                s=np.clip(.995*s+.00215*min(rainfall[i],95)-.0019*pet[i]+.0018,.06,.48)
                soil[i]=s
            acc=defaultdict(lambda:{'rainfall_mm':0.,'temperature_c':0.,'relative_humidity_pct':0.,
                  'solar_radiation_mj_m2':0.,'pet_proxy_mm':0.,'soil_moisture_m3m3':0.,'days':0,
                  'dry_days':0,'rainfall_3m':0})
            dry_rolling=np.convolve((rainfall<1).astype(int),np.ones(30,dtype=int),'full')[:len(dates)]
            for i,dt in enumerate(dts):
                ym=f'{dt.year:04d}-{dt.month:02d}'
                r=[dt.isoformat(),sid,town,district,province,f'{lat:.4f}',f'{lon:.4f}',
                    f'{rainfall[i]:.3f}',f'{temp[i]:.3f}',f'{hum[i]:.3f}',f'{dew[i]:.3f}',
                    f'{solar[i]:.3f}',f'{pet[i]:.3f}',f'{soil[i]:.5f}',f'{wb[i]:.3f}',1,'SYNTHETIC_SIMULATION']
                writer.writerow(r)
                if j==0 and len(preview)<200:preview.append(dict(zip(daily_cols,r)))
                a=acc[ym];a['rainfall_mm']+=rainfall[i];a['temperature_c']+=temp[i]
                a['relative_humidity_pct']+=hum[i];a['solar_radiation_mj_m2']+=solar[i]
                a['pet_proxy_mm']+=pet[i];a['soil_moisture_m3m3']+=soil[i];a['days']+=1
                a['dry_days']+=int(rainfall[i]<1)
                a['dry_days_30d_at_month_end']=int(dry_rolling[i])
            raw_rain=[acc[ym]['rainfall_mm'] for ym in unique_ym]
            spi1,param1=gamma_spi(raw_rain,1);spi3,param3=gamma_spi(raw_rain,3)
            for v in param1+param3:fits.append({'location_id':sid,'location_name':town,**v})
            rain_ref_by_month={m:np.mean([raw_rain[k] for k,x in enumerate(unique_ym) if 1981<=int(x[:4])<=2010 and int(x[-2:])==m]) for m in range(1,13)}
            for i,ym in enumerate(unique_ym):
                a=acc[ym];dd=a['days'];rr=raw_rain[i]
                def lag(k):return raw_rain[i-k] if i>=k else np.nan
                def rolling3(i):return sum(raw_rain[i-2:i+1]) if i>=2 else np.nan
                monthly_all.append({'location_id':sid,'location_name':town,'district':district,'province':province,
                   'latitude':lat,'longitude':lon,'forecast_issue_month':ym,
                   'rainfall_monthly_mm':round(rr,3),'temperature_c':round(a['temperature_c']/dd,3),
                   'relative_humidity_pct':round(a['relative_humidity_pct']/dd,3),
                   'solar_radiation_mj_m2_total':round(a['solar_radiation_mj_m2'],3),
                   'pet_proxy_monthly_mm':round(a['pet_proxy_mm'],3),
                   'soil_moisture_m3m3':round(a['soil_moisture_m3m3']/dd,5),
                   'dry_days_month':a['dry_days'],'dry_days_30d':a['dry_days_30d_at_month_end'],
                   'rainfall_3m_mm':round(rolling3(i),3) if i>=2 else '',
                   'rainfall_lag_1_mm':round(lag(1),3) if i>=1 else '',
                   'rainfall_lag_3_mm':round(lag(3),3) if i>=3 else '',
                   'rainfall_anomaly_mm':round(rr-rain_ref_by_month[int(ym[-2:])],3),
                   'spi_1':round(float(spi1[i]),5) if np.isfinite(spi1[i]) else '',
                   'spi_3':round(float(spi3[i]),5) if np.isfinite(spi3[i]) else '',
                   'risk_current':band(spi3[i]),
                   'target_month_h1':month_add(ym,1) if i+1<len(unique_ym) else '',
                   'target_month_h3':month_add(ym,3) if i+3<len(unique_ym) else '',
                   'target_month_h6':month_add(ym,6) if i+6<len(unique_ym) else '',
                   'target_spi3_h1':round(float(spi3[i+1]),5) if i+1<len(unique_ym) and np.isfinite(spi3[i+1]) else '',
                   'target_spi3_h3':round(float(spi3[i+3]),5) if i+3<len(unique_ym) and np.isfinite(spi3[i+3]) else '',
                   'target_spi3_h6':round(float(spi3[i+6]),5) if i+6<len(unique_ym) and np.isfinite(spi3[i+6]) else '',
                   'target_risk_h1':band(spi3[i+1]) if i+1<len(unique_ym) else '',
                   'target_risk_h3':band(spi3[i+3]) if i+3<len(unique_ym) else '',
                   'target_risk_h6':band(spi3[i+6]) if i+6<len(unique_ym) else '',
                   'split_h1':partition(month_add(ym,1)) if i+1<len(unique_ym) else 'UNLABELED',
                   'split_h3':partition(month_add(ym,3)) if i+3<len(unique_ym) else 'UNLABELED',
                   'split_h6':partition(month_add(ym,6)) if i+6<len(unique_ym) else 'UNLABELED',
                   'is_synthetic':1,'data_origin':'SYNTHETIC_SIMULATION','quality_status':'SIMULATED_NOT_OBSERVED'})
            print(f'generated {j+1}/{len(SITES)}: {town}',flush=True)
    monthlycols=list(monthly_all[0]); ml=[r for r in monthly_all if 2001<=int(r['forecast_issue_month'][:4])<=2025]
    save_csv(DATA/'drought_monthly_ml.csv',ml,monthlycols)
    save_csv(DATA/'monthly_reference_1981_2025.csv',monthly_all,monthlycols)
    save_csv(DATA/'climatology_spi.csv',fits,list(fits[0]))
    save_csv(DATA/'environmental_daily_preview.csv',preview,daily_cols)
    sitescols=['location_id','location_name','district','province','latitude','longitude','zone','data_origin']
    sitesrows=[dict(zip(sitescols,list(s[:6])+[s[-1],'SYNTHETIC_STUDY_SITE'])) for s in SITES]
    save_csv(DATA/'locations_demo.csv',sitesrows,sitescols)
    geo=[]
    for sid,town,district,province,lat,lon,mult,zone in SITES:
        w=.05
        geo.append({'type':'Feature','properties':{'location_id':sid,'location_name':town,'district':district,'province':province,
            'synthetic_demo':True,'geometry_is_surveyed_coconut_plantation':False,
            'notice':'Arbitrary approximately 0.1-degree demo square, not a verified coconut land-use polygon'},
            'geometry':{'type':'Polygon','coordinates':[[[lon-w,lat-w],[lon+w,lat-w],[lon+w,lat+w],[lon-w,lat+w],[lon-w,lat-w]]]}})
    (DATA/'coconut_grid.geojson').write_text(json.dumps({'type':'FeatureCollection','features':geo},ensure_ascii=False),encoding='utf-8')
    cuts=[]
    for h in (1,3,6):
        elig=[r for r in ml if r[f'target_spi3_h{h}']!='' and r['spi_3']!='' and r[f'split_h{h}'] in ('TRAIN','VALIDATION','TEST')]
        for split in ('TRAIN','VALIDATION','TEST'):
            subset=[r for r in elig if r[f'split_h{h}']==split]
            save_csv(MODEL/f'{split.lower()}_h{h}.csv',subset,monthlycols)
            cuts.append({'horizon_months':h,'partition':split,'rows':len(subset)})
    save_csv(DATA/'dataset_splits_summary.csv',cuts,['horizon_months','partition','rows'])
    manifest=[{'artifact':'environmental_daily.csv.gz','origin':'SIMULATED','source_name':'seeded simulation generator','source_url':'','actual_observations':False,'period':'1981-2025'},
        {'artifact':'monthly_reference_1981_2025.csv','origin':'DERIVED_FROM_SIMULATED','source_name':'daily simulator','source_url':'','actual_observations':False,'period':'1981-2025'},
        {'artifact':'drought_monthly_ml.csv','origin':'DERIVED_FROM_SIMULATED','source_name':'daily simulator and fixed gamma climatology','source_url':'','actual_observations':False,'period':'2001-2025'},
        {'artifact':'coconut_grid.geojson','origin':'SYNTHETIC_DEMO_GEOMETRY','source_name':'approximate site centers only','source_url':'','actual_observations':False,'period':'not applicable'},
        {'artifact':'ERA5-Land (not included)','origin':'PUBLIC_REAL_SOURCE_OPTION','source_name':'Copernicus ERA5-Land','source_url':'https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land-timeseries','actual_observations':False,'period':'requires user data acquisition'},
        {'artifact':'CHIRPS v3 (not included)','origin':'PUBLIC_REAL_SOURCE_OPTION','source_name':'Climate Hazards Center','source_url':'https://www.chc.ucsb.edu/data/chirps3','actual_observations':False,'period':'requires user data acquisition'}]
    save_csv(DATA/'source_manifest.csv',manifest,list(manifest[0]))
    metrics=[]
    for h in (1,3,6):
        subset=[r for r in ml if r[f'split_h{h}']=='TEST' and r[f'target_spi3_h{h}']!='' and r['spi_3']!='']
        truth=np.array([float(r[f'target_spi3_h{h}']) for r in subset]); pers=np.array([float(r['spi_3']) for r in subset]); clim=np.zeros(len(subset))
        for name,pred in [('Persistence_SPI3',pers),('Seasonal_Climatology_SPI3',clim)]:
            metrics.append({'horizon_months':h,'model':name,'test_sample_count':len(truth),
                'mae':round(float(np.mean(abs(truth-pred))),5),
                'rmse':round(float(np.sqrt(np.mean((truth-pred)**2))),5),
                'evaluation_data':'SIMULATED_TEST_ONLY','reported_as_real_world_accuracy':False})
    save_csv(DATA/'baseline_evaluation.csv',metrics,list(metrics[0]))
    md={'seed':SEED,'generator':'synthetic_environmental_simulation','generation_utc':datetime.now(timezone.utc).isoformat(),
        'sites':len(SITES),'daily_records':len(SITES)*len(dts),'reference_monthly_records':len(monthly_all),
        'ml_monthly_records':len(ml),'period':'1981-01-01 to 2025-12-31','split_basis':'target date per horizon',
        'warning':'EVERY numeric environmental record is simulated. NOT official Sri Lankan weather, measured plantation stress or verified coconut land-use.',
        'actual_field_records':0,'actual_weather_records':0,
        'notes':'PET and soil-moisture are heuristic simulation proxies, not measured quantities; reference gamma fits fixed to synthetic 1981-2010.'}
    (DATA/'generation_metadata.json').write_text(json.dumps(md,indent=2),encoding='utf-8')
    assert len(ml)==len(SITES)*25*12
    assert all(r['is_synthetic']==1 for r in ml)
    assert all((not r['target_month_h6']) or r['target_month_h6']>r['forecast_issue_month'] for r in ml)
    print(json.dumps(md,indent=2));return md

if __name__=='__main__':generate()

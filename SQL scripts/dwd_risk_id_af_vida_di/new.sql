-- 将 ODS 表中的 VidaCfFullNew/VidaCfFrNew/VidaCfDemogNew/VidaLdnFullNew 数据写入 DWD 表
-- INSERT INTO TABLE risk.dwd_risk_id_af_vida_di
WITH exploded_assessment_results AS (
  SELECT 
    t.resp_raw_data,
    t.header_data,
    t.request_key,
    t.data_source_name,
    t.data_source_code,
    t.trace_id,
    t.create_time,
    t.update_time,
    get_json_object(tbl.assessment_result, '$.name') AS assessment_name,
    get_json_object(tbl.assessment_result, '$.result') * 10 AS assessment_score -- 将[0,1]范围转换为[0,10]范围
  FROM (
    SELECT 
      resp_raw_data,
      header_data,
      request_key,
      data_source_name,
      data_source_code,
      trace_id,
      create_time,
      update_time,
      get_json_object(resp_raw_data, '$.data.assessmentResults') AS assessment_results
    FROM risk.ods__credit_risk_datafetch_id_db__identity_data_tab__df
    WHERE data_source_name IN ('VidaCfFullNew', 'VidaCfFrNew', 'VidaCfDemogNew', 'VidaLdnFullNew') 
      AND grass_date = '${ds}'
  ) t
  LATERAL VIEW explode(json_to_array(assessment_results)) tbl AS assessment_result
),
exploded_fields AS (
  SELECT 
    t.resp_raw_data,
    t.header_data,
    t.request_key,
    t.data_source_name,
    t.data_source_code,
    t.trace_id,
    t.create_time,
    t.update_time,
    get_json_object(tbl.field, '$.field') AS field_name,
    get_json_object(tbl.field, '$.score') AS field_score
  FROM (
    SELECT 
      resp_raw_data,
      header_data,
      request_key,
      data_source_name,
      data_source_code,
      trace_id,
      create_time,
      update_time,
      get_json_object(resp_raw_data, '$.data.fields') AS fields
    FROM risk.ods__credit_risk_datafetch_id_db__identity_data_tab__df
    WHERE data_source_name IN ('VidaCfFullNew', 'VidaCfFrNew', 'VidaCfDemogNew', 'VidaLdnFullNew') 
      AND grass_date = '${ds}'
  ) t
  LATERAL VIEW explode(json_to_array(fields)) tbl AS field
)
SELECT
  get_json_object(t.header_data, '$.CreditUserId') AS credit_user_id,
  t.request_key AS request_key,
  t.data_source_name AS data_source_name,
  t.data_source_code AS data_source_code,
  get_json_object(t.resp_raw_data, '$.data.transactionId') AS kyc_event_id,
  get_json_object(t.resp_raw_data, '$.data.statusCode') AS kyc_status_raw,
  NULL AS score_pob,
  MAX(CASE WHEN a.assessment_name = 'full_name' THEN a.assessment_score ELSE NULL END) AS score_full_name,
  NULL AS score_address,
  NULL AS score_province,
  NULL AS score_city,
  MAX(CASE WHEN a.assessment_name = 'dob' THEN a.assessment_score ELSE NULL END) AS score_dob,
  NULL AS score_district,
  NULL AS score_village,
  MAX(CASE WHEN a.assessment_name = 'nik' THEN a.assessment_score ELSE NULL END) AS score_nik,
  NULL AS score_mother_maiden_name,
  NULL AS score_family_card_no,
  NULL AS score_demographic,
  MAX(CASE WHEN a.assessment_name = 'selfiePhoto' THEN a.assessment_score ELSE NULL END) AS score_selfiephoto,
  MAX(CASE WHEN f.field_name = 'liveness' THEN f.field_score ELSE NULL END) AS score_liveness,
  t.trace_id AS trace_id,
  format_time(t.create_time,'ID') as create_time,
  format_time(t.update_time,'ID') as update_time,
  date(t.create_time) as grass_date
FROM (
  SELECT 
    resp_raw_data,
    header_data,
    request_key,
    data_source_name,
    data_source_code,
    trace_id,
    create_time,
    update_time
  FROM risk.ods__credit_risk_datafetch_id_db__identity_data_tab__df
  WHERE data_source_name IN ('VidaCfFullNew', 'VidaCfFrNew', 'VidaCfDemogNew', 'VidaLdnFullNew')
    AND grass_date = '${ds}'
) t
LEFT JOIN exploded_assessment_results a
ON t.resp_raw_data = a.resp_raw_data
AND t.header_data = a.header_data
AND t.request_key = a.request_key
AND t.data_source_code = a.data_source_code
LEFT JOIN exploded_fields f
ON t.resp_raw_data = f.resp_raw_data
AND t.header_data = f.header_data
AND t.request_key = f.request_key
AND t.data_source_code = f.data_source_code
GROUP BY
  t.resp_raw_data,
  t.header_data,
  t.request_key,
  t.data_source_name,
  t.data_source_code,
  t.trace_id,
  t.create_time,
  t.update_time
;

-- 将 ODS 表中的 VidaCfDemog 数据写入 DWD 表
-- INSERT INTO TABLE risk.dwd_risk_id_af_vida_di
WITH assessment_results AS (
  SELECT 
    resp_raw_data,
    header_data,
    request_key,
    data_source_name,
    data_source_code,
    trace_id,
    create_time,
    update_time,
    result_obj.name AS result_name,
    result_obj.result AS result_value
  FROM risk.ods__credit_risk_datafetch_id_db__identity_data_tab__df
  LATERAL VIEW EXPLODE(
    FROM_JSON(
      get_json_object(resp_raw_data, '$.data.assessmentResults'),
      'array<struct<name:string,result:double>>'
    )
  ) results AS result_obj
  WHERE data_source_name = 'VidaCfDemog' AND grass_date = '${ds}'
)
SELECT
  get_json_object(t.header_data, '$.CreditUserId') AS credit_user_id,
  t.request_key AS request_key,
  t.data_source_name AS data_source_name,
  t.data_source_code AS data_source_code,
  get_json_object(t.resp_raw_data, '$.data.EventId') AS kyc_event_id,
  get_json_object(t.resp_raw_data, '$.data.certificateIssued') AS kyc_status_raw,
  CASE 
    WHEN date(t.create_time) >= date('2024-03-21') THEN NULL
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
    ELSE NULL
  END AS score_pob,
  MAX(CASE WHEN f.result_name = 'full_name' THEN f.result_value ELSE NULL END) AS score_full_name,
  NULL AS score_address,
  NULL AS score_province,
  NULL AS score_city,
  CASE 
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
    ELSE NULL
  END AS score_dob,
  NULL AS score_district,
  NULL AS score_village,
  CASE 
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
    ELSE NULL
  END AS score_nik,
  NULL AS score_mother_maiden_name,
  NULL AS score_family_card_no,
  CASE 
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
    ELSE NULL
  END AS score_demographic,
  NULL AS score_selfiephoto,
  NULL AS score_liveness,
  t.trace_id AS trace_id,
  t.create_time AS create_time,
  t.update_time AS update_time,
  '${ds}' AS grass_date
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
  WHERE data_source_name = 'VidaCfDemog' AND grass_date = '${ds}'
) t
LEFT JOIN assessment_results f
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

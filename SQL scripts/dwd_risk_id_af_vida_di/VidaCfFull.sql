-- 将 ODS 表中的 VidaCfFull 数据写入 DWD 表
-- INSERT INTO TABLE risk.dwd_risk_id_af_vida_di
WITH exploded_fields AS (
  SELECT 
    resp_raw_data,
    header_data,
    request_key,
    data_source_name,
    data_source_code,
    trace_id,
    create_time,
    update_time,
    field_obj.field AS field_name,
    field_obj.score AS field_score
  FROM risk.ods__credit_risk_datafetch_id_db__identity_data_tab__df
  LATERAL VIEW EXPLODE(
    FROM_JSON(
      get_json_object(resp_raw_data, '$.data.fields'),
      'array<struct<field:string,score:double>>'
    )
  ) fields AS field_obj
  WHERE data_source_name = 'VidaCfFull' AND grass_date = '${ds}'
)
SELECT
  get_json_object(t.header_data, '$.CreditUserId') AS credit_user_id,
  t.request_key AS request_key,
  t.data_source_name AS data_source_name,
  t.data_source_code AS data_source_code,
  get_json_object(t.resp_raw_data, '$.data.EventId') AS kyc_event_id,
  get_json_object(t.resp_raw_data, '$.data.certificateIssued') AS kyc_status_raw,
  -- 条件表达式处理字段
  CASE 
    WHEN TO_DATE(t.create_time) >= TO_DATE('2024-03-21') THEN NULL
    ELSE 
      CASE 
        WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
        WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
        ELSE NULL
      END
  END AS score_pob,
  CASE 
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
    ELSE NULL
  END AS score_full_name,
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
  CASE 
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '200' THEN 10
    WHEN get_json_object(t.resp_raw_data, '$.data.certificateIssued') = '444' THEN 0
    ELSE NULL
  END AS score_selfiephoto,
  -- 处理score_liveness字段
  MAX(CASE WHEN f.field_name = 'liveness' THEN f.field_score ELSE NULL END) AS score_liveness,
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
  WHERE data_source_name = 'VidaCfFull' AND grass_date = '${ds}'
) t
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

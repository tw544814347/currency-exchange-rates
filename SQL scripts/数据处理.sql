# 数据处理
processed_count = 0
results = []
for index, row in risk_ads_risk_ods_upstream_storage_hive_table_info_df.iterrows():

    hive_table = row['full_tbl_name']
    retention_size = row['retention_days_399d']

    try:
        pre_check_sql = f"select count(1) as cnt from {hive_table} limit 1"
        pre_check_condition = spark.sql(pre_check_sql).collect()[0]["cnt"]
    except Exception as e:
        print(f"[ERROR] Pre-check failed for table {hive_table}: {e} SQL: select count(1) from tab limit 1.")
        continue

    pre_check_sql = "select count(1) as cnt from {hive_table} limit 1".format(hive_table = hive_table)
    pre_check_condition = spark.sql(pre_check_sql).collect()[0]["cnt"]
    # 判断是否 > 0
    if pre_check_condition > 0:
        sql = """
            WITH tmp AS
            (
                select count(1) as daily_count, grass_date
                from {hive_table}
                where grass_date <= CAST('{ds1}' AS string)
                group by grass_date
                order by grass_date desc
                limit cast({retention_size} as int)
            ),
            
            lag_tag as
            (
            SELECT 
                grass_date,
                daily_count,
                daily_count - LAG(daily_count) OVER (ORDER BY grass_date) AS diff_from_1_days_ago,
                daily_count - LAG(daily_count, 3) OVER (ORDER BY grass_date) AS diff_from_3_days_ago,
                daily_count - LAG(daily_count, 7) OVER (ORDER BY grass_date) AS diff_from_7_days_ago,
                daily_count - LAG(daily_count, 14) OVER (ORDER BY grass_date) AS diff_from_14_days_ago,
                daily_count - LAG(daily_count, 30) OVER (ORDER BY grass_date) AS diff_from_30_days_ago,
                daily_count - LAG(daily_count, 100) OVER (ORDER BY grass_date) AS diff_from_100_days_ago,
                daily_count - LAG(daily_count, 180) OVER (ORDER BY grass_date) AS diff_from_180_days_ago,
                daily_count - LAG(daily_count, 360) OVER (ORDER BY grass_date) AS diff_from_360_days_ago
            FROM tmp
            ),
            
            noupdate_tag as 
            (
                select 
                    *,
                    case when diff_from_1_days_ago > 0 or diff_from_1_days_ago is null then null
                        when diff_from_1_days_ago = 0 then 1
                        else -1
                        end as no_update_tag_1d,
                    case when diff_from_3_days_ago > 0 or diff_from_3_days_ago is null then null
                        when diff_from_3_days_ago = 0 then 3
                        else -3
                        end as no_update_tag_3d,
                    case when diff_from_7_days_ago > 0 or diff_from_7_days_ago is null then null
                        when diff_from_7_days_ago = 0 then 7
                        else -7
                        end as no_update_tag_7d,
                    case when diff_from_14_days_ago > 0 or diff_from_14_days_ago is null then null
                        when diff_from_14_days_ago = 0 then 14
                        else -14
                        end as no_update_tag_14d,
                    case when diff_from_30_days_ago > 0 or diff_from_30_days_ago is null then null
                        when diff_from_30_days_ago = 0 then 30
                        else -30
                        end as no_update_tag_30d,
                    case when diff_from_100_days_ago > 0 or diff_from_100_days_ago is null then null
                        when diff_from_100_days_ago = 0 then 100
                        else -100
                        end as no_update_tag_100d,
                    case when diff_from_180_days_ago > 0 or diff_from_180_days_ago is null then null
                        when diff_from_180_days_ago = 0 then 180
                        else -180
                        end as no_update_tag_180d,
                    case when diff_from_360_days_ago > 0 or diff_from_360_days_ago is null then null
                        when diff_from_360_days_ago = 0 then 360
                        else -360
                        end as no_update_tag_360d
                from lag_tag
                where grass_date = '{ds1}'
            )
            
            select 
                '{hive_table}' as db_tab,
                concat_ws(',',no_update_tag_1d, no_update_tag_3d,no_update_tag_7d, no_update_tag_30d, no_update_tag_100d, no_update_tag_180d, no_update_tag_360d) 
                    as no_update_tag_list_l360d,
                no_update_tag_1d, no_update_tag_3d,no_update_tag_7d, no_update_tag_30d, no_update_tag_100d, no_update_tag_180d, no_update_tag_360d,
                greatest((no_update_tag_1d), (no_update_tag_3d),(no_update_tag_7d), (no_update_tag_30d), (no_update_tag_100d), (no_update_tag_180d), (no_update_tag_360d)) as max_no_update_period_360d,
                least((no_update_tag_1d), (no_update_tag_3d),(no_update_tag_7d), (no_update_tag_30d), (no_update_tag_100d), (no_update_tag_180d), (no_update_tag_360d)) as min_no_update_period_360d,
                '{retention_size}' as retention_size
            from noupdate_tag;
               """.format(hive_table = hive_table, retention_size = retention_size, ds1 = t1)
        # print(sql)
        df_ods_hive_info = spark.sql(sql) 
        # print(df_ods_hive_info)
        # if merged_df is None:
        #     merged_df = df_ods_hive_info
        # else:
        #         merged_df = merged_df.unionByName(df_ods_hive_info)
        
        # dataframe 会导致内存溢出，改为 list，因为每次执行结果只有 1 行数据 
        row0 = spark.sql(sql).first() # only 1 row

        processed_count += 1

        if row0:
            d = row0.asDict()
            d['grass_date'] = t1
            results.append(d)
            
        # 每处理 20 张就清一次缓存，释放内存
        if (processed_count + 1) % 20 == 0:
            spark.catalog.clearCache()
        
    else:
        print('No data found in the table: {hive_table} ,even though there exists HDFS files.'.format(hive_table = hive_table))
print(results)

try:
    # merged_df_with_partition = merged_df.withColumn("grass_date", lit(t1))
    merged_df_with_partition = spark.createDataFrame(results)
    # print(merged_df_with_partition.show(5, truncate=False))
    
    # 写入 hive 表 
    merged_df_with_partition.write \
        .mode("overwrite") \
        .format("hive") \
        .partitionBy("grass_date") \
        .saveAsTable("risk.ads_risk_ods_upstream_update_hive_table_info_df")
except Exception as e:
    print(f"[INFO] Failed to process merged_df: {e}")
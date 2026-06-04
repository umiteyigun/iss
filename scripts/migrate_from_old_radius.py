#!/usr/bin/env python3
"""Migrate data from old RADIUS server to new ISS radius DB (tenant_id=2)."""

import pymysql

TARGET_TENANT_ID = 2

REMOTE = {
    "host": "192.168.9.155",
    "user": "radius",
    "password": "321321",
    "charset": "utf8",
    "database": "radius",
}

LOCAL = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "your_secure_password_here",
    "charset": "utf8mb4",
    "database": "radius",
}

BATCH = 2000


def connect(cfg):
    return pymysql.connect(**cfg)


def fetch_all(remote, table, columns="*"):
    cur = remote.cursor()
    cur.execute(f"SELECT {columns} FROM `{table}`")
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    return cols, rows


def insert_rows(local, table, columns, rows, transform=None):
    if not rows:
        print(f"  {table}: 0 rows (skip)")
        return 0
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(columns))
    col_sql = ", ".join(f"`{c}`" for c in columns)
    sql = f"INSERT INTO `{table}` ({col_sql}) VALUES ({placeholders})"
    count = 0
    batch = []
    for row in rows:
        data = dict(zip(columns, row)) if transform else row
        if transform:
            data = transform(data)
            values = tuple(data[c] for c in columns)
        else:
            values = row
        batch.append(values)
        if len(batch) >= BATCH:
            cur.executemany(sql, batch)
            count += len(batch)
            batch = []
    if batch:
        cur.executemany(sql, batch)
        count += len(batch)
    local.commit()
    print(f"  {table}: {count} rows")
    return count


def migrate_packets(remote, local):
    cols, rows = fetch_all(remote, "packetsInfo")
    out = []
    for r in rows:
        d = dict(zip(cols, r))
        d["tenant_id"] = TARGET_TENANT_ID
        out.append(tuple(d[c] for c in cols if c != "id"))
    insert_cols = [c for c in cols if c != "id"]
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(insert_cols))
    col_sql = ", ".join(f"`{c}`" for c in insert_cols)
    sql = f"INSERT INTO `packetsInfo` ({col_sql}) VALUES ({placeholders})"
    cur.executemany(sql, out)
    local.commit()
    print(f"  packetsInfo: {len(out)} rows")


def migrate_nas(remote, local):
    cols, rows = fetch_all(remote, "nas")
    insert_cols = [c for c in cols if c != "id"]
    out = []
    for r in rows:
        d = dict(zip(cols, r))
        d["tenant_id"] = TARGET_TENANT_ID
        if not d.get("nasname"):
            continue
        out.append(tuple(d[c] for c in insert_cols))
    if not out:
        print("  nas: 0 rows")
        return
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(insert_cols))
    col_sql = ", ".join(f"`{c}`" for c in insert_cols)
    sql = f"INSERT INTO `nas` ({col_sql}) VALUES ({placeholders})"
    cur.executemany(sql, out)
    local.commit()
    print(f"  nas: {len(out)} rows")


def migrate_radcheck(remote, local):
    cols, rows = fetch_all(remote, "radcheck")
    insert_cols = [c for c in cols if c != "id"]
    out = []
    for r in rows:
        d = dict(zip(cols, r))
        d["tenant_id"] = TARGET_TENANT_ID
        out.append(tuple(d[c] for c in insert_cols))
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(insert_cols))
    col_sql = ", ".join(f"`{c}`" for c in insert_cols)
    sql = f"INSERT INTO `radcheck` ({col_sql}) VALUES ({placeholders})"
    cur.executemany(sql, out)
    local.commit()
    print(f"  radcheck: {len(out)} rows")


def migrate_radreply(remote, local):
    cols, rows = fetch_all(remote, "radreply")
    insert_cols = [c for c in cols if c != "id"]
    out = [tuple(dict(zip(cols, r))[c] for c in insert_cols) for r in rows]
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(insert_cols))
    col_sql = ", ".join(f"`{c}`" for c in insert_cols)
    sql = f"INSERT INTO `radreply` ({col_sql}) VALUES ({placeholders})"
    cur.executemany(sql, out)
    local.commit()
    print(f"  radreply: {len(out)} rows")


def migrate_radippool(remote, local):
    cols, rows = fetch_all(remote, "radippool")
    insert_cols = [c for c in cols if c != "id"]
    out = []
    for r in rows:
        d = dict(zip(cols, r))
        d["tenant_id"] = TARGET_TENANT_ID
        out.append(tuple(d[c] for c in insert_cols))
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(insert_cols))
    col_sql = ", ".join(f"`{c}`" for c in insert_cols)
    sql = f"INSERT INTO `radippool` ({col_sql}) VALUES ({placeholders})"
    cur.executemany(sql, out)
    local.commit()
    print(f"  radippool: {len(out)} rows")


def migrate_metroip(remote, local):
    cols, rows = fetch_all(remote, "metroIP")
    insert_cols = [c for c in cols if c != "id"]
    out = []
    for r in rows:
        d = dict(zip(cols, r))
        d["tenant_id"] = TARGET_TENANT_ID
        out.append(tuple(d[c] for c in insert_cols))
    cur = local.cursor()
    placeholders = ", ".join(["%s"] * len(insert_cols))
    col_sql = ", ".join(f"`{c}`" for c in insert_cols)
    sql = f"INSERT INTO `metroIP` ({col_sql}) VALUES ({placeholders})"
    cur.executemany(sql, out)
    local.commit()
    print(f"  metroIP: {len(out)} rows")


def migrate_usersinfo(remote, local):
    local_cols = ["username", "name", "lastname", "email", "packet", "address", "tenant_id"]
    cur_r = remote.cursor()
    cur_r.execute("SELECT username, name, lastname, email, packet, address FROM usersInfo")
    rows = cur_r.fetchall()
    out = [(*r, TARGET_TENANT_ID) for r in rows]
    cur_l = local.cursor()
    placeholders = ", ".join(["%s"] * len(local_cols))
    col_sql = ", ".join(f"`{c}`" for c in local_cols)
    sql = f"INSERT INTO `usersInfo` ({col_sql}) VALUES ({placeholders})"
    cur_l.executemany(sql, out)
    local.commit()
    print(f"  usersInfo: {len(out)} rows")


def migrate_radacct(remote, local):
    cur_r = remote.cursor()
    cur_l = local.cursor()
    cur_r.execute("DESCRIBE radacct")
    remote_cols = [x[0] for x in cur_r.fetchall()]
    cur_l.execute("DESCRIBE radacct")
    local_cols = [x[0] for x in cur_l.fetchall()]
    common = [c for c in local_cols if c in remote_cols and c != "radacctid"]
    col_sql = ", ".join(f"`{c}`" for c in common)
    placeholders = ", ".join(["%s"] * len(common))
    sql = f"INSERT INTO `radacct` ({col_sql}) VALUES ({placeholders})"

    cur_r.execute(f"SELECT {', '.join('`'+c+'`' for c in common)} FROM radacct")
    total = 0
    while True:
        chunk = cur_r.fetchmany(BATCH)
        if not chunk:
            break
        cur_l.executemany(sql, chunk)
        local.commit()
        total += len(chunk)
        if total % 50000 == 0:
            print(f"  radacct: {total} rows...")
    print(f"  radacct: {total} rows (done)")


def main():
    print(f"Migrating to tenant_id={TARGET_TENANT_ID} (KOU Teknopark)")
    remote = connect(REMOTE)
    local = connect(LOCAL)
    try:
        local.cursor().execute("SET FOREIGN_KEY_CHECKS=0")
        local.commit()
        migrate_packets(remote, local)
        migrate_nas(remote, local)
        migrate_radcheck(remote, local)
        migrate_radreply(remote, local)
        migrate_radippool(remote, local)
        migrate_metroip(remote, local)
        migrate_usersinfo(remote, local)
        migrate_radacct(remote, local)
        local.cursor().execute("SET FOREIGN_KEY_CHECKS=1")
        local.commit()
        print("Migration completed.")
    finally:
        remote.close()
        local.close()


if __name__ == "__main__":
    main()

import * as migration_20260721_180500 from './20260721_180500';
import * as migration_20260722_042651_add_coupons_and_order_snapshots from './20260722_042651_add_coupons_and_order_snapshots';
import * as migration_20260722_055932_required_product_sku from './20260722_055932_required_product_sku';

export const migrations = [
  {
    up: migration_20260721_180500.up,
    down: migration_20260721_180500.down,
    name: '20260721_180500',
  },
  {
    up: migration_20260722_042651_add_coupons_and_order_snapshots.up,
    down: migration_20260722_042651_add_coupons_and_order_snapshots.down,
    name: '20260722_042651_add_coupons_and_order_snapshots',
  },
  {
    up: migration_20260722_055932_required_product_sku.up,
    down: migration_20260722_055932_required_product_sku.down,
    name: '20260722_055932_required_product_sku'
  },
];

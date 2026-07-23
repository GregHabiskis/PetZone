import * as migration_20260721_180500 from './20260721_180500';
import * as migration_20260722_042651_add_coupons_and_order_snapshots from './20260722_042651_add_coupons_and_order_snapshots';
import * as migration_20260722_055932_required_product_sku from './20260722_055932_required_product_sku';
import * as migration_20260722_081625_move_customers_out_of_admin from './20260722_081625_move_customers_out_of_admin';
import * as migration_20260722_233000_add_reviews_locked_docs from './20260722_233000_add_reviews_locked_docs';
import * as migration_20260723_111900_add_order_idempotency_and_review_uniqueness from './20260723_111900_add_order_idempotency_and_review_uniqueness';
import * as migration_20260723_121200_remove_small_pets_pet_type from './20260723_121200_remove_small_pets_pet_type';
import * as migration_20260723_160000_add_product_short_description from './20260723_160000_add_product_short_description';
import * as migration_20260723_remove_reptile_pet_type from './20260723_remove_reptile_pet_type';

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
    name: '20260722_055932_required_product_sku',
  },
  {
    up: migration_20260722_081625_move_customers_out_of_admin.up,
    down: migration_20260722_081625_move_customers_out_of_admin.down,
    name: '20260722_081625_move_customers_out_of_admin'
  },
  {
    up: migration_20260722_233000_add_reviews_locked_docs.up,
    down: migration_20260722_233000_add_reviews_locked_docs.down,
    name: '20260722_233000_add_reviews_locked_docs'
  },
  {
    up: migration_20260723_111900_add_order_idempotency_and_review_uniqueness.up,
    down: migration_20260723_111900_add_order_idempotency_and_review_uniqueness.down,
    name: '20260723_111900_add_order_idempotency_and_review_uniqueness'
  },
  {
    up: migration_20260723_121200_remove_small_pets_pet_type.up,
    down: migration_20260723_121200_remove_small_pets_pet_type.down,
    name: '20260723_121200_remove_small_pets_pet_type'
  },
  {
    up: migration_20260723_160000_add_product_short_description.up,
    down: migration_20260723_160000_add_product_short_description.down,
    name: '20260723_160000_add_product_short_description'
  },
  {
    up: migration_20260723_remove_reptile_pet_type.up,
    down: migration_20260723_remove_reptile_pet_type.down,
    name: '20260723_remove_reptile_pet_type'
  },
];

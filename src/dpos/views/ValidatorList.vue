<template>
  <main class="validators">
    <div class="row" v-if="validators && validators.length > 0">
      <div class="col">
        <header>
          <h1>{{ $t('views.validator_list.validators') }}</h1>
        </header>
        <b-card
          no-body
          style="justify-content: space-around;flex-direction: row;text-align: center;align-items: flex-end;padding-top: 5px;"
        >
          <h6>
            {{ $t('views.validator_list.next_election_in') }}
            <election-timer />
          </h6>
          <h6>
            {{ $t('views.validator_list.total_staked_amount') }}
            <h5 class="highlight">{{totalStaked | tokenAmount(18,0)}} LOOM</h5>
          </h6>
        </b-card>
        <div class="content">
          <template v-if="isSmallDevice">
            <div class="py-3"></div>

            <b-card
              v-for="validator in validators"
              :key="validator.name"
              :disabled="!!validator.isBootstrap"
              @click="showValidatorDetail(validator)"
              class="validator-card-mobile mb-3"
              no-body
            >
              <div class="copy-wrapper">
                <h6>
                  <span :class="[validator.active ? 'active-symbol active' : 'active-symbol']"></span>
                  {{validator.name}}
                </h6>
              </div>
              <div class="copy-wrapper">
                <label>{{ $t('components.validator_extended_detail.fee') }}</label>
                <strong>{{validator.fee}}</strong>
              </div>
              <div class="copy-wrapper">
                <label>{{ $t('views.validator_list.stake') }}</label>
                <strong>{{validator.totalStaked | tokenAmount(18,0)}} LOOM</strong>
              </div>
            </b-card>
          </template>
          <template v-else>
            <b-table
              responsive
              table-active="table-active"
              tr-class="spacer"
              :items="validators"
              :fields="validatorFields"
              :sort-desc="false"
              :sort-compare="sortCompare"
              @row-clicked="showValidatorDetail"
            >
              <template slot="name" slot-scope="data">
                <li :class="[data.item.jailed ? 'jailed-symbol jailed' : 'jailed-symbol']"></li>{{ data.item.name }}
              </template>
              <template slot="active" slot-scope="data">{{ data.item.active ? $t('views.validator_detail.active') : "" }}</template>
            </b-table>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import Vue from "vue"
import { Component, Watch } from "vue-property-decorator"
import LoadingSpinner from "../components/LoadingSpinner.vue"
import ElectionTimer from "../components/ElectionTimer.vue"
import { CryptoUtils, LocalAddress } from "loom-js"
import { HasDPOSState } from "@/dpos/store/types"
import { ZERO } from "../../utils"
import { formatTokenAmount } from "@/filters"
import BN from "bn.js"

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max))
}

let seed = parseInt(localStorage.getItem("validatorListSeed") || "0", 10) || getRandomInt(100)
localStorage.setItem("validatorListSeed", "" + seed)

function random() {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

@Component({
  components: { ElectionTimer },
})
export default class ValidatorList extends Vue {
  isSmallDevice = window.innerWidth < 600

  validatorFields: any[] = []

  created() {
    this.validatorFields = [{ key: "name", sortable: true, label: this.$t("views.validator_list.name") },
      { key: "active", sortable: true, label: this.$t("views.validator_detail.active") },
      //  { key: "recentlyMissedBlocks", sortable: true, label: "Recently missed blocks" },
      {
        key: "totalStaked",
        sortable: true,
        label: this.$t("components.modals.faucet_redelegate_modal.total_stake"),
        formatter: (value) => formatTokenAmount(value, 18, 0),
        thClass: "align-center-th",
        tdClass: "align-right-td",
      },
      {
        key: "fee",
        sortable: true,
        label: this.$t("components.validator_extended_detail.fee"),
        formatter: (value) => value + "%",
        thClass: "align-center-th",
        tdClass: "align-right-td",
      },
    ]
  }

  get state(): HasDPOSState {
    return this.$store.state
  }

  get totalStaked() {
    // ignore bootstrap node
    const filtered = this.state.dpos.validators.filter((v) => !v.isBootstrap)
    return filtered.reduce((sum, v) => sum.add(v.totalStaked), ZERO)
  }

  get validators() {
    const storeValidators = this.state.dpos.validators.sort((a, b) => {
      const aValue = a.isBootstrap ? 0 : random() * 10000
      const bValue = b.isBootstrap ? 0 : random() * 10000
      return Math.floor(aValue) - Math.floor(bValue)
    }).reverse()
    return storeValidators
  }
  /**
   * adds class bootstrap node if is bootstrap
   */
  validatorCssClass(item, type) {
    return item.isBootstrap ? ["bootstrap-validator"] : []
  }

  showValidatorDetail(record, index) {
    this.$router.push(`/validator/${encodeURIComponent(record.name)}`)
  }

  sortCompare(aRow, bRow, key) {
    const a = aRow[key] // or use Lodash _.get()
    const b = bRow[key]
    if (
      (typeof a === "number" && typeof b === "number") ||
      (a instanceof Date && b instanceof Date)
    ) {
      // If both compared fields are native numbers or both are dates
      return a < b ? -1 : a > b ? 1 : 0
    } else if (a instanceof BN && b instanceof BN) {
      return a.lt(b) ? -1 : a.gt(b) ? 1 : 0
    } else {
      // Otherwise stringify the field data and use String.prototype.localeCompare
      return this.toString(a).localeCompare(this.toString(b), undefined, {
        numeric: true,
      })
    }
  }

  // Helper function to stringify the values of an Object
  toString(value) {
    if (value === null || typeof value === "undefined") {
      return ""
    } else if (value instanceof Object) {
      return Object.keys(value)
        .sort()
        .map((key) => this.toString(value[key]))
        .join(" ")
    } else {
      return String(value)
    }
  }
}
</script>

<style lang="scss">
tr {
  &:hover {
    background-color: #5756e60f;
    cursor: pointer;
  }
}

main.validators {
  // ther should be global class for page titles
  header > h1 {
    color: #5246d5;
    font-size: 1.35em;
    text-align: center;
    margin: 16px -14px;
    font-weight: normal;
    border-bottom: 1px solid #ededed;
    padding-bottom: 16px;
  }

  .list-group-item {
    padding: 0.2em 1em;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    > h6 {
      flex: 1;
    }
    &.disabled {
      opacity: 0.5;
    }
    .stakes {
      text-align: right;
      width: 110px;
    }
    .fee {
      flex: 0;
      font-size: 10px;
      widows: 10px;
    }
    .stakes > label {
      display: block;
      display: none;
      margin: 0;
      font-size: 12px;
      line-height: 12px;
      text-align: left;
    }
    .fee > label {
      display: inline-block;
      margin: 0;
      font-size: 10px;
      line-height: 24px;
      text-align: right;
      vertical-align: bottom;
      margin-right: 7px;
      font-weight: bold;
      color: rgba(128, 128, 128, 0.58);
    }
    .status {
      flex: 50%;
      font-size: 0.8em;
      &.active {
        color: green;
      }
    }
  }
  .align-center-th {
    text-align: center;
  }
  .align-right-td {
    text-align: right;
    padding-right: 3%;
  }
}

.validator-card-mobile {
  padding: 12px 6px;
  border-left: 6px solid #00bcd4 !important;
  .copy-wrapper {
    display: flex;
    justify-content: space-between;
    padding: 0 12px;
    h6 {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 20px;
      .active-symbol {
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-right: 3px;
        border-radius: 50%;
        background-color: #ec1d05;
        &.active {
          background-color: #3bef3b;
        }
      }
    }
  }
}

.jailed-symbol {
  display: block;
  float: left;
  width: 10px;
  height: 10px;
  margin-top: 7px;
  margin-right: 1rem;
  border-radius: 100%;
  background-color: #3bef3b;
  animation: fade 1s alternate infinite;

  &.jailed {
    background-color: #ec1d05;
  }
}

@keyframes fade {
    from { opacity: 0.5; }
    to   { opacity: 1; }
}
</style>

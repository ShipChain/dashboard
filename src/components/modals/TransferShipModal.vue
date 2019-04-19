<template>
    <b-modal id="transfer-ship-modal" ref="modalRef" ok-only hide-header centered>
        <b-container fluid>
            <div v-if="loading" class="loading-spinner-container">
                <loading-spinner :showBackdrop="true"></loading-spinner>
            </div>
            <div v-else>
                <b-row class="my-1 mb-3">
                    <b-col sm="3"><label>{{ $t('components.modals.faucet_delegate_modal.amount') }}</label></b-col>
                    <b-col sm="9"><b-form-input v-model="transferDetail.amount" :state="transferDetail && transferDetail.amount && transferDetail.amount > minAmount && transferDetail.amount <= userBalance.loomBalance" type="number" :min="minAmount" :max="userBalance.loomBalance"></b-form-input></b-col>
                </b-row>
                <b-row class="my-1 mb-3">
                    <b-col sm="3"><label>Address</label></b-col>
                    <b-col sm="9"><b-form-input v-model="transferDetail.receiver" :state="transferDetail && transferDetail.receiver && isReceiverValid" type="text" ></b-form-input></b-col>
                </b-row>
            </div>
        </b-container>
        <div slot="modal-footer" class="w-100">
            <b-button v-if="!loading" style="width: 160px; float: right;" variant="primary" :disabled="!isAmountValid || !isReceiverValid" @click="transferShip">{{okTitle}}</b-button>
        </div>
    </b-modal>
</template>

<script>
    import Vue from 'vue';
    import { Component } from 'vue-property-decorator';
    import LoadingSpinner from '../../components/LoadingSpinner';
    import { mapGetters, mapActions, createNamespacedHelpers } from 'vuex';
    import * as web3 from "web3";

    const DappChainStore = createNamespacedHelpers('DappChain');
    const DPOSStore = createNamespacedHelpers('DPOS');

    @Component({
        components: {
            LoadingSpinner
        },
        computed: {
            ...mapGetters([
                'getPrivateKey'
            ]),
            ...DappChainStore.mapGetters([
                'currentChain',
                'currentRPCUrl',
            ]),
            ...DappChainStore.mapState([
                'validators',
            ]),
            ...DPOSStore.mapState([
                'userBalance'
            ])
        },
        methods: {
            ...mapActions([
                'setError'
            ]),
            ...DappChainStore.mapActions([
                'transferCoinToAddress'
            ])
        }
    })

    export default class TransferShipModal extends Vue {
        transferDetail = {
            amount: '',
            receiver: ''
        };

        okTitle = "Transfer";
        minAmount = 0;
        loading = false;

        async transferShip() {

            if(this.transferDetail.amount <= 0) {
                this.setError("Invalid amount");
                return
            }

            this.loading = true;

            try {
                await this.transferCoinToAddress({
                    receiver: this.transferDetail.receiver,
                    amount: this.transferDetail.amount,
                });
                this.loading = false;
                this.$emit('onTransfer');
                this.$root.$emit('bv::hide::modal', 'transfer-ship-modal');
            } catch(err) {
                this.setError({msg: "Transfer failed", err});
                this.loading = false;
            }
        }

        get isAmountValid() {
            return this.transferDetail && +this.transferDetail.amount > 0;
        }

        get isReceiverValid() {
            return this.transferDetail && this.transferDetail.receiver && web3.utils.isAddress(this.transferDetail.receiver);
        }

        show() {
            this.$refs.modalRef.show();
        }

    };
</script>
<style lang="scss">
    label {
        color: gray;
    }
    .loading-spinner-container {
        height: 200px;
    }
</style>

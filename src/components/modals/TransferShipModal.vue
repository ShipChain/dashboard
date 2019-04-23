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
                    <b-col sm="9">
                        <b-form-group label="Address Type">
                            <b-form-radio-group inline v-model="transferDetail.type" >
                                <b-form-radio value='eth'>Eth</b-form-radio>
                                <b-form-radio value='default'>Sidechain</b-form-radio>
                            </b-form-radio-group>
                            <b-form-input v-model="transferDetail.receiver" :state="transferDetail && transferDetail.receiver && isReceiverValid" type="text" ></b-form-input>
                        </b-form-group>
                    </b-col>
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
            receiver: '',
            type: 'eth',
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
                    type: this.transferDetail.type,
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
            if(!this.transferDetail || !this.transferDetail.receiver){
                return false;
            }

            let inputAddress = this.transferDetail.receiver;
            if(!web3.utils.isAddress(inputAddress)){
                console.warn(`Transfer address is not valid checksum ${inputAddress}`);
                inputAddress = web3.utils.toChecksumAddress(inputAddress);
            }
            return web3.utils.isAddress(inputAddress);
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

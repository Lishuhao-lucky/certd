<template>
  <div class="access-selector">
    <span v-if="target.name" class="mr-5 cd-flex-inline">
      <a-tag class="mr-5" color="green">{{ target.name }}</a-tag>
      <fs-icon class="cd-icon-button" icon="ion:close-circle-outline" @click="clear"></fs-icon>
    </span>
    <span v-else class="mlr-5 text-gray">{{ placeholder }}</span>
    <a-button class="ml-5" :size="size" @click="chooseForm.open">选择</a-button>
    <a-form-item-rest v-if="chooseForm.show">
      <a-modal v-model:open="chooseForm.show" title="选择授权提供者" width="900px" @ok="chooseForm.ok">
        <div style="height: 400px; position: relative">
          <cert-access-modal v-model="selectedId" :type="type" :from="from"></cert-access-modal>
        </div>
      </a-modal>
    </a-form-item-rest>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, watch } from "vue";
import CertAccessModal from "./access/index.vue";
import { createAccessApi } from "../api";

export default defineComponent({
  name: "AccessSelector",
  components: { CertAccessModal },
  props: {
    modelValue: {
      type: [Number, String],
      default: null
    },
    type: {
      type: String,
      default: "aliyun"
    },
    placeholder: {
      type: String,
      default: "请选择"
    },
    size: {
      type: String,
      default: "middle"
    },
    from: {
      type: String, //user | sys
      default: "user"
    }
  },
  emits: ["update:modelValue"],
  setup(props, ctx) {
    const api = createAccessApi(props.from);

    const target = ref({});
    const selectedId = ref();
    async function refreshTarget(value) {
      selectedId.value = value;
      if (value > 0) {
        target.value = await api.GetObj(value);
      }
    }

    function clear() {
      selectedId.value = "";
      target.value = null;
      ctx.emit("update:modelValue", selectedId.value);
    }

    watch(
      () => {
        return props.modelValue;
      },
      async (value) => {
        selectedId.value = null;
        target.value = {};
        if (value == null) {
          return;
        }
        await refreshTarget(value);
      },
      {
        immediate: true
      }
    );

    const providerDefine = ref({});

    async function refreshProviderDefine(type) {
      providerDefine.value = await api.GetProviderDefine(type);
    }
    watch(
      () => {
        return props.type;
      },
      async (value) => {
        await refreshProviderDefine(value);
      },
      {
        immediate: true
      }
    );

    const chooseForm = reactive({
      show: false,
      open() {
        chooseForm.show = true;
      },
      ok: () => {
        chooseForm.show = false;
        console.log("choose ok:", selectedId.value);
        refreshTarget(selectedId.value);
        ctx.emit("update:modelValue", selectedId.value);
      }
    });

    return {
      clear,
      target,
      selectedId,
      providerDefine,
      chooseForm
    };
  }
});
</script>
<style lang="less">
.access-selector {
}
</style>

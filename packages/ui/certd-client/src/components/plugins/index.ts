import SynologyIdDeviceGetter from "./synology/device-id-getter.vue";
import RemoteSelect from "./common/remote-select.vue";
import CertDomainsGetter from "./common/cert-domains-getter.vue";
import OutputSelector from "/@/components/plugins/common/output-selector/index.vue";
import DnsProviderSelector from "/@/components/plugins/cert/dns-provider-selector/index.vue";
import DomainsVerifyPlanEditor from "/@/components/plugins/cert/domains-verify-plan-editor/index.vue";
import AccessSelector from "/@/views/certd/access/access-selector/index.vue";
import InputPassword from "./common/input-password.vue";
import ApiTest from "./common/api-test.vue";
export * from "./cert/index.js";
export default {
  install(app: any) {
    app.component("OutputSelector", OutputSelector);
    app.component("DnsProviderSelector", DnsProviderSelector);
    app.component("DomainsVerifyPlanEditor", DomainsVerifyPlanEditor);
    app.component("AccessSelector", AccessSelector);
    app.component("ApiTest", ApiTest);

    app.component("SynologyDeviceIdGetter", SynologyIdDeviceGetter);
    app.component("RemoteSelect", RemoteSelect);
    app.component("CertDomainsGetter", CertDomainsGetter);
    app.component("InputPassword", InputPassword);
  }
};

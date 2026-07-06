import { HostsEntity } from './hosts.entity';

type HostWithRawInboundConstructorData = {
    rawInbound: object | null;
    inboundTag: string;
    xrayJsonTemplate: object | null;
    xrayJsonTemplates?: object[];
} & ConstructorParameters<typeof HostsEntity>[0];

export class HostWithRawInbound extends HostsEntity {
    public rawInbound: object | null;
    public inboundTag: string;
    public xrayJsonTemplate: object | null;
    public xrayJsonTemplates: object[];

    constructor(data: HostWithRawInboundConstructorData) {
        super(data);

        this.rawInbound = data.rawInbound;
        this.inboundTag = data.inboundTag;
        this.xrayJsonTemplate = data.xrayJsonTemplate;
        this.xrayJsonTemplates = data.xrayJsonTemplates ?? [];
    }
}

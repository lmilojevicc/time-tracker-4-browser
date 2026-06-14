import { t } from '@app/locale'
import { Delete, Edit } from '@element-plus/icons-vue'
import { css } from '@emotion/css'
import Flex from '@pages/components/Flex'
import { getColor } from '@pages/util/style'
import { ElButton, ElCard, ElFormItem, ElScrollbar, ElTag, ElText } from 'element-plus'
import { computed, CSSProperties, defineComponent, Ref, toRef, VNode } from 'vue'
import { useFocusList } from '../context'

const useSessionStyle = (sessionRef: Ref<tt4b.focus.Session | undefined>, presetRef: Ref<tt4b.focus.Preset>) => {
    const color = computed(() => {
        const session = sessionRef.value
        const preset = presetRef.value
        if (!session) return
        if (session.presetId !== preset.id) return undefined
        const { state, phase } = session
        if (state !== 'running' && state !== 'paused') return undefined
        if (phase === 'break') return getColor('warning')
        if (state === 'paused') return getColor('info')
        return getColor('success')
    })

    const cardStyle = computed<CSSProperties>(() => color.value
        ? { border: `1px solid ${color.value}`, boxShadow: `0 0 8px ${color.value}` }
        : {}
    )

    const dot = computed<VNode | null>(() => color.value
        ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color.value, flexShrink: 0 }} />
        : null
    )

    return { cardStyle, dot }
}

const formatDurationText = (label: string, durSec: number | undefined): string | undefined => {
    if (!durSec) return undefined
    const hours = Math.floor(durSec / 3600)
    const minutes = Math.floor(durSec % 3600 / 60)
    const parts = [hours && `${hours}h`, minutes && `${minutes}m`].filter(Boolean)
    return `${label}: ${parts.join('') || '0m'}`
}

const paddingCls = css`
    padding: 10px 1rem;
`

type Props = {
    value: tt4b.focus.Preset
}

const Preset = defineComponent<Props>(props => {
    const preset = toRef(props, 'value')
    const { remove, session, modifyInst } = useFocusList()
    const timeText = computed(() => {
        const { duration, break: breakDur } = preset.value
        return [
            formatDurationText(t(msg => msg.shared.focus.duration), duration),
            formatDurationText(t(msg => msg.shared.focus.break), breakDur),
        ].filter(Boolean).join(' · ')
    })
    const { cardStyle, dot } = useSessionStyle(session, preset)

    return () => (
        <ElCard
            shadow="hover"
            style={{ height: '200px', ...cardStyle.value }}
            headerClass={paddingCls}
            footerClass={paddingCls}
            bodyStyle={{ padding: '14px' }}
            v-slots={{
                header: () => (
                    <Flex justify="space-between" align="center">
                        <Flex align="center" gap={6} style={{ overflow: 'hidden', minWidth: 0 }}>
                            {dot.value}
                            <ElText size="large" tag='b' truncated>{preset.value.name}</ElText>
                        </Flex>
                        <ElTag size="small" type="primary" effect="plain" round>
                            {t(msg => msg.shared.focus.template[preset.value.template].label)}
                        </ElTag>
                    </Flex>
                ),
                footer: () => (
                    <Flex justify="end" gap={4}>
                        <ElButton
                            size="small" text icon={Edit}
                            onClick={() => modifyInst.value?.modify(preset.value)}
                        />
                        <ElButton
                            size="small" text type="danger" icon={Delete}
                            onClick={() => remove(preset.value)}
                        />
                    </Flex>
                )
            }}
        >
            <Flex column gap={15} flex={1}>
                {timeText.value && <ElText>{timeText.value}</ElText>}

                <ElFormItem label={t(msg => msg.shared.focus.mode[preset.value.mode].label)}>
                    <ElScrollbar height={44}>
                        <Flex gap={4} wrap>
                            {preset.value.cond.map(c => <ElTag size="small" type="info">{c}</ElTag>)}
                        </Flex>
                    </ElScrollbar>
                </ElFormItem>
            </Flex>
        </ElCard>
    )
}, { props: ['value'] })

export default Preset
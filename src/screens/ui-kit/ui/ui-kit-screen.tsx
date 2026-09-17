import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import {
  appearanceFor,
  EMOTION_KEYS,
  EMOTIONS,
  emotionFor,
  moodFor,
  PET_COLORS,
  PET_MOOD_NAMES,
  PET_PATTERNS,
  PET_SPECIES,
  PET_STAGES,
} from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import {
  AnimatedIcon,
  BackIcon,
  Button,
  Card,
  CheckIcon,
  Chip,
  CloseIcon,
  Coin,
  CoinBadge,
  CoinIcon,
  Collapsible,
  clearToasts,
  dismissToast,
  ExternalLink,
  HelpIcon,
  HintRow,
  HomeIcon,
  Input,
  LineChart,
  ListRow,
  MeterCard,
  MinusIcon,
  PawIcon,
  PiggyIcon,
  PlusIcon,
  ProgressBar,
  ScratchCard,
  Screen,
  Shape,
  Sheet,
  ShopIcon,
  Slider,
  SplashOverlay,
  Switch,
  TasksIcon,
  Text,
  ThemedView,
  Toast,
  toast,
} from '@/shared/ui';

import { usePlayground } from '../model/use-playground';

import { KitSection } from './kit-section';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BUTTON_VARIANTS = [
  'primary',
  'accent',
  'success',
  'secondary',
  'ghost',
] as const;

const BUTTON_SIZES = ['l', 'm', 's'] as const;

const TEXT_VARIANTS = [
  'display',
  'title',
  'subtitle',
  'body',
  'bodyBold',
  'small',
  'smallBold',
  'label',
  'link',
  'linkPrimary',
  'code',
] as const;

const CHIP_VARIANTS = ['neutral', 'selected', 'need', 'want', 'muted'] as const;

/** Axes that land on each mood, so the static row can show all five. */
const PET_MOOD_AXES: Record<(typeof PET_MOOD_NAMES)[number], [number, number]> =
  {
    proud: [1, 1],
    content: [0.5, 0.5],
    bored: [1, 0.1],
    uncomfortable: [0.1, 1],
    sad: [0, 0],
  };

/** Side of a pet in the static galleries — the size 2.5.2 is judged at. */
const PET_TILE = 64;

/** The whole icon set, in the order the kit shows it. */
const ICONS = [
  ['HomeIcon', HomeIcon],
  ['ShopIcon', ShopIcon],
  ['TasksIcon', TasksIcon],
  ['PiggyIcon', PiggyIcon],
  ['PawIcon', PawIcon],
  ['BackIcon', BackIcon],
  ['PlusIcon', PlusIcon],
  ['MinusIcon', MinusIcon],
  ['CheckIcon', CheckIcon],
  ['CloseIcon', CloseIcon],
  ['HelpIcon', HelpIcon],
  ['CoinIcon', CoinIcon],
] as const;

/** Sizes an icon is asked for today: inline, default, and a tab bar's. */
const ICON_SIZES = [16, 24, 32] as const;

const SHAPE_VARIANTS = [
  'circle',
  'square',
  'diamond',
  'pill',
  'leaf',
  'dome',
] as const;

const SURFACE_TONES = [
  'background',
  'backgroundAlt',
  'surface',
  'surfaceSoft',
  'surfaceDeep',
] as const;

const LONG_TITLE =
  'Очень длинное название задания, которое обязано обрезаться, а не разъехаться';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Every component of `@/shared/ui` against all of its states at once. This is
 * the project's Storybook: it ships inside the app, so it costs no dependency
 * and runs on the real device.
 */
export const UiKitScreen = () => {
  const theme = useTheme();
  const playground = usePlayground();

  return (
    <>
      <Screen gap="three" isTabBarVisible={false}>
        <Screen.Header>
          <Screen.Back />
          <Screen.Heading>
            <Screen.Title>UI-кит</Screen.Title>
            <Screen.Subtitle>
              Все компоненты @/shared/ui и их состояния
            </Screen.Subtitle>
          </Screen.Heading>
          <HintButton screen="ui-kit" />
        </Screen.Header>

                <KitSection
          title="Playground"
          caption="Переключатели действуют на все секции сразу"
        >
          <HintRow>
            <HintRow.Title>Loading</HintRow.Title>
            <HintRow.Hint>
              <Switch
                label="Loading"
                isChecked={playground.isLoading}
                onChange={playground.setIsLoading}
              />
            </HintRow.Hint>
          </HintRow>

          <HintRow>
            <HintRow.Title>Disabled</HintRow.Title>
            <HintRow.Hint>
              <Switch
                label="Disabled"
                isChecked={playground.isDisabled}
                onChange={playground.setIsDisabled}
              />
            </HintRow.Hint>
          </HintRow>
        </KitSection>

        <KitSection title="Text" caption="Все 11 пресетов типографики">
          {TEXT_VARIANTS.map((variant) => (
            <KitSection.Row key={variant} label={variant}>
              <Text variant={variant}>Съешь ещё этих булочек — 1 240</Text>
            </KitSection.Row>
          ))}

          <KitSection.Row label="themeColor перебивает цвет варианта">
            <Text variant="linkPrimary" themeColor="accentStrong">
              Ссылка акцентным цветом
            </Text>
          </KitSection.Row>

          <KitSection.Row label="длинный текст в две строки">
            <Text numberOfLines={2}>{LONG_TITLE}</Text>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Button"
          caption="5 вариантов × 3 размера, loading и disabled — сверху"
        >
          {BUTTON_VARIANTS.map((variant) => (
            <KitSection.Row key={variant} label={variant} isInline>
              {BUTTON_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={variant}
                  size={size}
                  isLoading={playground.isLoading}
                  disabled={playground.isDisabled}
                  onPress={() => toast(`${variant} / ${size}`)}
                >
                  Размер {size.toUpperCase()}
                </Button>
              ))}
            </KitSection.Row>
          ))}

          <KitSection.Row label="Button.Label рядом с иконкой">
            <Button variant="accent" onPress={() => toast('Покупка')}>
              <Shape variant="circle" size={18} color={theme.coin} />
              <Button.Label>Купить за 15</Button.Label>
            </Button>
          </KitSection.Row>

          <KitSection.Row label="isFullWidth">
            <Button isFullWidth onPress={() => toast('Во всю ширину')}>
              Во всю ширину
            </Button>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Card"
          caption="Тона, выбранное состояние, нажатие и слоты Title / Content / Footer"
        >
          <KitSection.Row label="со всеми слотами">
            <Card
              isSelected={playground.isRowSelected}
              onPress={() =>
                playground.setIsRowSelected(!playground.isRowSelected)
              }
            >
              <Card.Title>Питомец</Card.Title>
              <Card.Content>
                <Text themeColor="textSecondary">
                  Нажми на карточку — она станет выбранной.
                </Text>
              </Card.Content>
              <Card.Footer>
                <Button size="s" variant="ghost">
                  Позже
                </Button>
                <Button size="s">Покормить</Button>
              </Card.Footer>
            </Card>
          </KitSection.Row>

          <KitSection.Row label="isSpread в футере">
            <Card tone="surfaceSoft">
              <Card.Title>Копилка</Card.Title>
              <Card.Footer isSpread>
                <CoinBadge amount={340} label="накоплено" />
                <Button size="s">Пополнить</Button>
              </Card.Footer>
            </Card>
          </KitSection.Row>

          <KitSection.Row label="без слотов, просто контейнер">
            <Card tone="backgroundAlt">
              <Text>Голый children без Card.Title.</Text>
            </Card>
          </KitSection.Row>
        </KitSection>

        <KitSection title="Chip" caption="5 вариантов, нажимаемый и статичный">
          <KitSection.Row label="варианты" isInline>
            {CHIP_VARIANTS.map((variant) => (
              <Chip key={variant} variant={variant}>
                {variant}
              </Chip>
            ))}
          </KitSection.Row>

          <KitSection.Row label="выбор — нажми на любой" isInline>
            {['Спорт', 'Музыка', 'Рисование'].map((label, index) => (
              <Chip
                key={label}
                variant={
                  playground.selectedChip === index ? 'selected' : 'neutral'
                }
                onPress={() =>
                  playground.setSelectedChip(
                    playground.selectedChip === index ? null : index,
                  )
                }
              >
                {label}
              </Chip>
            ))}
          </KitSection.Row>
        </KitSection>

        <KitSection title="Coin" caption="Гурт, тень и перелив — idle и active">
          <KitSection.Row label="размеры" isInline>
            <Coin size={22} />
            <Coin size={34} isActive />
            <Coin size={48} isActive />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="CoinBadge"
          caption="Баланс, дельта в обе стороны, ноль и крайние значения"
        >
          <KitSection.Row label="balance" isInline>
            <CoinBadge amount={0} />
            <CoinBadge amount={1240} label="монет" />
            <CoinBadge amount={9999999} />
          </KitSection.Row>

          <KitSection.Row label="delta — знак меняет палитру" isInline>
            <CoinBadge amount={15} variant="delta" />
            <CoinBadge amount={-15} variant="delta" />
            <CoinBadge amount="+250" variant="delta" />
            <CoinBadge amount="-250" variant="delta" />
          </KitSection.Row>

          <KitSection.Row label="plain и крупная монета" isInline>
            <CoinBadge amount={42} variant="plain" />
            <CoinBadge amount={42} coinSize={34} />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="ScratchCard"
          caption="Сотри защитный слой пальцем — как на лотерейном билете"
        >
          <ScratchCard foilLabel="Потри пальцем">
            <Coin size={40} isActive />
            <CoinBadge amount={100} label="стартовые" />
          </ScratchCard>
        </KitSection>

        <KitSection
          title="Collapsible"
          caption="Неуправляемый и управляемый — реальное раскрытие"
        >
          <KitSection.Row label="uncontrolled">
            <Collapsible style={styles.fullWidth}>
              <Collapsible.Trigger>Как начисляются монеты</Collapsible.Trigger>
              <Collapsible.Content>
                <Text themeColor="textSecondary">
                  Задания приносят больше, чем игры, — иначе игры вытеснят
                  задания.
                </Text>
              </Collapsible.Content>
            </Collapsible>
          </KitSection.Row>

          <KitSection.Row label="controlled — состояние в use-playground">
            <Collapsible
              isOpen={playground.isCollapsibleOpen}
              onOpenChange={playground.setIsCollapsibleOpen}
              style={styles.fullWidth}
            >
              <Collapsible.Trigger>
                <Text variant="smallBold">
                  {playground.isCollapsibleOpen ? 'Свернуть' : 'Развернуть'}
                </Text>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Text themeColor="textSecondary">
                  Триггер принимает не только строку, но и любой узел.
                </Text>
              </Collapsible.Content>
            </Collapsible>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="ExternalLink"
          caption="Открывается во встроенном браузере, не уводит из приложения"
        >
          <KitSection.Row>
            <ExternalLink
              href="https://docs.expo.dev/versions/v57.0.0/"
              asChild
            >
              <Text variant="linkPrimary">Документация Expo SDK 57</Text>
            </ExternalLink>
          </KitSection.Row>
        </KitSection>

        <KitSection title="HintRow" caption="Заголовок слева, пилюля справа">
          <HintRow>
            <HintRow.Title>Сегодня заработано</HintRow.Title>
            <HintRow.Hint>45 монет</HintRow.Hint>
          </HintRow>

          <HintRow>
            <HintRow.Title>Внутри пилюли — компонент</HintRow.Title>
            <HintRow.Hint>
              <CoinBadge amount={45} variant="plain" coinSize={16} />
            </HintRow.Hint>
          </HintRow>
        </KitSection>

        <KitSection
          title="Input"
          caption="Подпись, счётчик, плейсхолдер и предел длины"
        >
          <KitSection.Row label="с подписью и счётчиком">
            <Input
              value={playground.inputValue}
              onChangeText={playground.setInputValue}
              placeholder="Имя питомца"
              hint="Как зовут питомца?"
              isCounterVisible
              maxLength={12}
              editable={!playground.isDisabled}
            />
          </KitSection.Row>

          <KitSection.Row label="без подписи и счётчика">
            <Input placeholder="Пусто" editable={!playground.isDisabled} />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="ListRow"
          caption="Слоты, выбранная и выполненная строки, длинный текст"
        >
          <KitSection.Row label="полная строка — нажми, чтобы отметить">
            <ListRow
              title="Полить цветы"
              subtitle="15 монет"
              icon={
                <ListRow.Icon tone="successSoft">
                  <Shape variant="leaf" size={22} color={theme.success} />
                </ListRow.Icon>
              }
              trailing={<CoinBadge amount={15} variant="plain" coinSize={16} />}
              isDone={playground.isRowDone}
              onPress={() => playground.setIsRowDone(!playground.isRowDone)}
            />
          </KitSection.Row>

          <KitSection.Row label="isSelected">
            <ListRow title="Выбранная строка" subtitle="С рамкой" isSelected />
          </KitSection.Row>

          <KitSection.Row label="без слотов и с длинным текстом">
            <ListRow title={LONG_TITLE} />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="MeterCard"
          caption="Три тона и крайние значения; уровень — ползунком ниже"
        >
          <KitSection.Row label="default / low / idle" isInline>
            <MeterCard
              label="Сытость"
              value={playground.meterValue}
              icon={<Shape variant="circle" size={20} color={theme.warning} />}
            />
            <MeterCard
              label="Настроение"
              value={playground.meterValue}
              tone="low"
              color="accent"
            />
            <MeterCard label="Сон" value={playground.meterValue} tone="idle" />
          </KitSection.Row>

          <KitSection.Row label="ноль, максимум и длинная подпись" isInline>
            <MeterCard label="Пусто" value={0} />
            <MeterCard label="Полно" value={1} color="success" />
            <MeterCard label="Очень длинная подпись метра" value={0.5} />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="ProgressBar"
          caption="Значения за пределами 0…1 обрезаются"
        >
          <KitSection.Row label="0 / текущее / 1 / 2 (обрезано)">
            <ProgressBar value={0} />
            <ProgressBar value={playground.meterValue} color="primary" />
            <ProgressBar value={1} color="accent" />
            <ProgressBar value={2} color="warning" />
          </KitSection.Row>

          <KitSection.Row label="толщина и цвет дорожки">
            <ProgressBar value={0.4} height={4} />
            <ProgressBar value={0.4} height={20} trackColor="primarySoft" />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Screen"
          caption="Этот экран и есть пример: фон, safe area, скролл и колонка по MAX_CONTENT_WIDTH"
        >
          <KitSection.Row label="Screen.Header со всеми слотами">
            <Screen.Header>
              <Screen.Back />
              <Screen.Heading>
                <Screen.Title>Заголовок</Screen.Title>
                <Screen.Subtitle>Подзаголовок</Screen.Subtitle>
              </Screen.Heading>
              <CoinBadge amount={7} variant="plain" coinSize={16} />
            </Screen.Header>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Icons"
          caption="24×24, обводка 2 — цвет по умолчанию читаемый"
        >
          <KitSection.Row label="весь набор" isInline>
            {ICONS.map(([name, Icon]) => (
              <View key={name} style={styles.iconCell}>
                <Icon />
                <Text variant="label" themeColor="textMuted">
                  {name.replace('Icon', '')}
                </Text>
              </View>
            ))}
          </KitSection.Row>

          <KitSection.Row label="размеры — 16, 24, 32" isInline>
            {ICON_SIZES.map((size) => (
              <HomeIcon key={size} size={size} />
            ))}
          </KitSection.Row>

          <KitSection.Row label="цвет — проп перебивает тему" isInline>
            <CoinIcon color={theme.coin} />
            <CheckIcon color={theme.success} />
            <CloseIcon color={theme.textMuted} />
            <PawIcon color={theme.primary} />
          </KitSection.Row>

          <KitSection.Row label="иконка рядом с подписью — 3.6" isInline>
            <Button variant="accent" onPress={() => toast('Куплено')}>
              <CoinIcon size={18} color={theme.inverseText} />
              <Button.Label>Купить за 15</Button.Label>
            </Button>
          </KitSection.Row>

          <KitSection.Row label="на цветной подложке" isInline>
            <View
              style={[styles.iconPlate, { backgroundColor: theme.primary }]}
            >
              <HomeIcon color={theme.inverseText} />
            </View>
            <View
              style={[styles.iconPlate, { backgroundColor: theme.surfaceDeep }]}
            >
              <HomeIcon color={theme.textMuted} />
            </View>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="LineChart"
          caption="Одна и две серии, один замер, ровная линия и пусто"
        >
          <KitSection.Row label="две серии с легендой">
            <LineChart
              series={[
                {
                  values: [12, 30, 24, 41, 38, 52],
                  color: 'success',
                  label: 'Пришло',
                },
                {
                  values: [8, 22, 31, 19, 40, 27],
                  color: 'accent',
                  label: 'Ушло',
                },
              ]}
              labels={['1', '2', '3', '4', '5', '6']}
              style={styles.fullWidth}
            />
          </KitSection.Row>

          <KitSection.Row label="одна серия">
            <LineChart
              series={[{ values: [5, 18, 9, 27], color: 'primary' }]}
              labels={['1', '2', '3', '4']}
              style={styles.fullWidth}
            />
          </KitSection.Row>

          <KitSection.Row label="один замер — точка по центру, не у края">
            <LineChart
              series={[{ values: [14], color: 'primary' }]}
              labels={['1']}
              style={styles.fullWidth}
            />
          </KitSection.Row>

          <KitSection.Row label="всё по нулям — линия по низу, а не пустота">
            <LineChart
              series={[{ values: [0, 0, 0, 0], color: 'primary' }]}
              labels={['1', '2', '3', '4']}
              style={styles.fullWidth}
            />
          </KitSection.Row>

          <KitSection.Row label="без данных">
            <LineChart series={[]} style={styles.fullWidth} />
          </KitSection.Row>
        </KitSection>

        <KitSection title="Shape" caption="6 геометрий, заливка и обводка">
          <KitSection.Row label="заливка" isInline>
            {SHAPE_VARIANTS.map((variant) => (
              <Shape
                key={variant}
                variant={variant}
                size={32}
                color={theme.primary}
              />
            ))}
          </KitSection.Row>

          <KitSection.Row label="isOutlined" isInline>
            {SHAPE_VARIANTS.map((variant) => (
              <Shape
                key={variant}
                variant={variant}
                size={32}
                color={theme.accent}
                isOutlined
              />
            ))}
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Sheet"
          caption="Реальное открытие, перетаскивание вниз и запрет закрытия"
        >
          <KitSection.Row label="isDismissible">
            <Switch
              label="Можно закрыть перетаскиванием"
              isChecked={playground.isSheetDismissible}
              onChange={playground.setIsSheetDismissible}
            />
          </KitSection.Row>

          <KitSection.Row>
            <Button onPress={() => playground.setIsSheetVisible(true)}>
              Открыть шторку
            </Button>
          </KitSection.Row>

          <KitSection.Row label="Sheet без модалки, isGrabberVisible={false}">
            <Sheet isGrabberVisible={false} style={styles.fullWidth}>
              <Sheet.Title>Заголовок шторки</Sheet.Title>
              <Sheet.Description>
                Корень можно использовать и отдельно — например, как нижний блок
                внутри экрана.
              </Sheet.Description>
              <Sheet.Actions>
                <Button isFullWidth size="m">
                  Понятно
                </Button>
              </Sheet.Actions>
            </Sheet>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Slider"
          caption="Настоящее перетаскивание; тап и вертикальный скролл значение не меняют"
        >
          <KitSection.Row
            label={`0…100, шаг 5 — сейчас ${playground.sliderValue}`}
          >
            <Slider
              value={playground.sliderValue}
              min={0}
              max={100}
              step={5}
              onChange={playground.setSliderValue}
            />
          </KitSection.Row>

          <KitSection.Row label="min = 5, шаг 10 — минимум достижим">
            <Slider
              value={playground.meterValue * 100}
              min={5}
              max={95}
              step={10}
              color="accent"
              onChange={(value) => playground.setMeterValue(value / 100)}
            />
          </KitSection.Row>

          <KitSection.Row label="узкий диапазон 0…1, шаг 0.1">
            <Slider
              value={playground.meterValue}
              min={0}
              max={1}
              step={0.1}
              color="success"
              onChange={playground.setMeterValue}
            />
          </KitSection.Row>

          <KitSection.Row label="isThumbFilled — как на плане бюджета">
            <Slider
              value={playground.sliderValue}
              min={0}
              max={100}
              step={5}
              color="accent"
              isThumbFilled
              track={[theme.surface, theme.surfaceDeep, theme.accent]}
              onChange={playground.setSliderValue}
            />
          </KitSection.Row>
        </KitSection>

        <KitSection title="Switch" caption="Настоящее переключение и disabled">
          <KitSection.Row label="обычный" isInline>
            <Switch
              label="Звук"
              isChecked={playground.isChecked}
              onChange={playground.setIsChecked}
            />
          </KitSection.Row>

          <KitSection.Row label="isDisabled в обоих положениях" isInline>
            <Switch
              label="Выключен"
              isChecked={false}
              onChange={() => {}}
              isDisabled
            />
            <Switch label="Включён" isChecked onChange={() => {}} isDisabled />
          </KitSection.Row>
        </KitSection>

        <KitSection title="ThemedView" caption="Все фоновые токены">
          <KitSection.Row isInline>
            {SURFACE_TONES.map((tone) => (
              <ThemedView key={tone} variant={tone} style={styles.swatch}>
                <Text variant="label" themeColor="textMuted">
                  {tone}
                </Text>
              </ThemedView>
            ))}
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Toast / Toaster"
          caption="Всплывает снизу, смахивается вверх; больше трёх не показывается"
        >
          <KitSection.Row label="статичный вид" isInline>
            <Toast>Задание выполнено</Toast>
            <Toast variant="warning">Не хватает монет</Toast>
          </KitSection.Row>

          <KitSection.Row label="через очередь" isInline>
            <Button size="s" onPress={() => toast('Задание выполнено')}>
              dark
            </Button>
            <Button
              size="s"
              variant="accent"
              onPress={() => toast('Не хватает монет', { variant: 'warning' })}
            >
              warning
            </Button>
            <Button
              size="s"
              variant="ghost"
              onPress={() => {
                toast('Первый');
                toast('Второй');
                toast('Третий');
                toast('Четвёртый — вытеснит первый');
              }}
            >
              очередь
            </Button>
          </KitSection.Row>

          <KitSection.Row label="снять с очереди" isInline>
            <Button
              size="s"
              variant="secondary"
              onPress={() => {
                const id = toast('Исчезнет через секунду');

                setTimeout(() => dismissToast(id), 1000);
              }}
            >
              dismissToast
            </Button>
            <Button size="s" variant="secondary" onPress={clearToasts}>
              clearToasts
            </Button>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Питомец"
          caption="Слои SVG, лицо из каталога эмоций, анимации на UI-потоке"
        >
          <KitSection.Row label="живой — управляется переключателями ниже">
            <View style={styles.petStage}>
              <PetView
                appearance={appearanceFor(
                  playground.petSpecies,
                  playground.petColor,
                  playground.petPattern,
                )}
                emotion={emotionFor(
                  moodFor(playground.petComfort, playground.petSpirit),
                )}
                stage={playground.petStage}
              />
            </View>
            <Text variant="small" themeColor="textMuted">
              {moodFor(playground.petComfort, playground.petSpirit).name} ·{' '}
              {moodFor(playground.petComfort, playground.petSpirit).reason} →{' '}
              {
                EMOTIONS[
                  emotionFor(
                    moodFor(playground.petComfort, playground.petSpirit),
                  )
                ].title
              }
            </Text>
          </KitSection.Row>

          <KitSection.Row label="вид" isInline>
            {PET_SPECIES.map((species) => (
              <Chip
                key={species}
                variant={
                  playground.petSpecies === species ? 'selected' : 'neutral'
                }
                onPress={() => playground.setPetSpecies(species)}
              >
                {species}
              </Chip>
            ))}
          </KitSection.Row>

          <KitSection.Row label="окрас" isInline>
            {PET_COLORS.map((color) => (
              <Chip
                key={color}
                variant={playground.petColor === color ? 'selected' : 'neutral'}
                onPress={() => playground.setPetColor(color)}
              >
                {color}
              </Chip>
            ))}
          </KitSection.Row>

          <KitSection.Row label="узор" isInline>
            {PET_PATTERNS.map((pattern) => (
              <Chip
                key={pattern}
                variant={
                  playground.petPattern === pattern ? 'selected' : 'neutral'
                }
                onPress={() => playground.setPetPattern(pattern)}
              >
                {pattern}
              </Chip>
            ))}
          </KitSection.Row>

          <KitSection.Row label="стадия роста" isInline>
            {PET_STAGES.map((stage) => (
              <Chip
                key={stage}
                variant={playground.petStage === stage ? 'selected' : 'neutral'}
                onPress={() => playground.setPetStage(stage)}
              >
                {stage}
              </Chip>
            ))}
          </KitSection.Row>

          <KitSection.Row label="comfort — тело: сытость и тепло">
            <Slider
              value={Math.round(playground.petComfort * 100)}
              min={0}
              max={100}
              onChange={(value) => playground.setPetComfort(value / 100)}
              style={styles.fullWidth}
            />
          </KitSection.Row>

          <KitSection.Row label="spirit — цель, задания, итог периода">
            <Slider
              value={Math.round(playground.petSpirit * 100)}
              min={0}
              max={100}
              onChange={(value) => playground.setPetSpirit(value / 100)}
              style={styles.fullWidth}
            />
          </KitSection.Row>

          <KitSection.Row
            label="девятка — 3 вида × 3 окраса, статично"
            isInline
          >
            {PET_SPECIES.flatMap((species) =>
              PET_COLORS.map((color) => (
                <PetView
                  key={`${species}:${color}`}
                  appearance={appearanceFor(species, color, 'solid')}
                  emotion="calm"
                  stage="adult"
                  size={PET_TILE}
                  isAnimated={false}
                />
              )),
            )}
          </KitSection.Row>

          <KitSection.Row label="узоры" isInline>
            {PET_PATTERNS.map((pattern) => (
              <PetView
                key={pattern}
                appearance={appearanceFor('cat', 'mint', pattern)}
                emotion="calm"
                stage="adult"
                size={PET_TILE}
                isAnimated={false}
              />
            ))}
          </KitSection.Row>

          <KitSection.Row label="стадии — малыш, подросток, взрослый" isInline>
            {PET_STAGES.map((stage) => (
              <PetView
                key={stage}
                appearance={appearanceFor('dog', 'sand', 'solid')}
                emotion="calm"
                stage={stage}
                size={PET_TILE}
                isAnimated={false}
              />
            ))}
          </KitSection.Row>

          <KitSection.Row label="пять состояний — через emotionFor" isInline>
            {PET_MOOD_NAMES.map((name) => {
              const [comfort, spirit] = PET_MOOD_AXES[name];

              return (
                <View key={name} style={styles.petMood}>
                  <PetView
                    appearance={appearanceFor('capybara', 'graphite', 'solid')}
                    emotion={emotionFor(moodFor(comfort, spirit))}
                    stage="adult"
                    size={PET_TILE}
                    isAnimated={false}
                  />
                  <Text variant="label" themeColor="textMuted">
                    {name}
                  </Text>
                </View>
              );
            })}
          </KitSection.Row>

          <KitSection.Row label="весь каталог лиц" isInline>
            {EMOTION_KEYS.map((key) => (
              <View key={key} style={styles.petMood}>
                <PetView
                  appearance={appearanceFor('cat', 'sand', 'spots')}
                  emotion={key}
                  stage="teen"
                  size={PET_TILE}
                  isAnimated={false}
                />
                <Text variant="label" themeColor="textMuted">
                  {EMOTIONS[key].title}
                </Text>
              </View>
            ))}
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="AnimatedIcon / SplashOverlay"
          caption="Обе анимации играют по-настоящему"
        >
          <KitSection.Row label="AnimatedIcon — свечение вращается бесконечно">
            <View style={styles.iconStage}>
              <AnimatedIcon />
            </View>
          </KitSection.Row>

          <KitSection.Row label="SplashOverlay — проигрывается один раз">
            <Button
              size="s"
              variant="secondary"
              onPress={playground.replaySplash}
            >
              Проиграть заново
            </Button>
          </KitSection.Row>
        </KitSection>
      </Screen>

      <Sheet.Modal
        isVisible={playground.isSheetVisible}
        isDismissible={playground.isSheetDismissible}
        onClose={() => playground.setIsSheetVisible(false)}
      >
        <Sheet.Title>Потратить 15 монет?</Sheet.Title>
        <Sheet.Description>
          {playground.isSheetDismissible
            ? 'Потяни вниз или нажми мимо, чтобы закрыть.'
            : 'Закрыть можно только кнопкой — перетаскивание отключено.'}
        </Sheet.Description>
        <Sheet.Actions>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => playground.setIsSheetVisible(false)}
          >
            Отмена
          </Button>
          <Button
            isFullWidth
            onPress={() => {
              playground.setIsSheetVisible(false);
              toast('Куплено');
            }}
          >
            Купить
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>

      {playground.splashRun > 0 && <SplashOverlay key={playground.splashRun} />}
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  petMood: {
    alignItems: 'center',
    gap: SPACING.one,
  },
  petStage: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  iconCell: {
    alignItems: 'center',
    gap: SPACING.half,
    width: 62,
  },
  iconPlate: {
    alignItems: 'center',
    borderRadius: SPACING.two,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconStage: {
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 220,
    justifyContent: 'center',
  },
  swatch: {
    alignItems: 'center',
    borderRadius: SPACING.two,
    height: 56,
    justifyContent: 'center',
    width: 96,
  },
});

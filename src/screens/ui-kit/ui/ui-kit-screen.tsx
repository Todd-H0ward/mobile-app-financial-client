import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import {
  PUZZLE_SCENES,
  type SceneName,
  SPRITE_PALETTE,
  SPRITES,
  type SpriteName,
} from '@/entities/sprite';

import { SPACING, TERMINAL_VARIANT } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import {
  Button,
  Card,
  ChamferCard,
  Chip,
  Coin,
  CoinBadge,
  clearToasts,
  dismissToast,
  IllustratedBackdrop,
  Input,
  ListGroup,
  ListRow,
  LoadingArtwork,
  PIXEL_ICON_NAMES,
  PixelArt,
  PixelIcon,
  ProgressBar,
  RingsBackdrop,
  Screen,
  Segmented,
  Shape,
  Sheet,
  Slider,
  SplashOverlay,
  Switch,
  TerminalDock,
  TerminalPanel,
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

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'warning'] as const;

const SPRITE_NAMES = Object.keys(SPRITES) as SpriteName[];

const SCENE_NAMES = Object.keys(PUZZLE_SCENES) as SceneName[];

/** Only the outline ink: every other pixel falls back to transparent. */
const OUTLINE_ONLY = { k: SPRITE_PALETTE.k };

const BUTTON_SIZES = ['xl', 'l', 'm', 's'] as const;

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
  'machine',
  'numberSmall',
  'number',
  'numberLarge',
] as const;

const CHIP_VARIANTS = [
  'neutral',
  'selected',
  'need',
  'want',
  'muted',
  'success',
  'warning',
  'rule',
  'locked',
] as const;

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

export const UiKitScreen = () => {
  const theme = useTheme();
  const playground = usePlayground();

  return (
    <>
      <Screen gap={SPACING.THREE}>
        <Screen.Header>
          <Screen.Back />
          <Screen.Heading>
            <Screen.Title>UI-кит</Screen.Title>
            <Screen.Subtitle>Выше нуля · Терминал 2b</Screen.Subtitle>
          </Screen.Heading>
          <HintButton screen="ui-kit" />
        </Screen.Header>

        <KitSection
          title="Playground"
          caption="Переключатели действуют на все секции сразу"
        >
          <ListGroup style={styles.fullWidth}>
            <ListGroup.Item
              title="Loading"
              trailing={
                <Switch
                  label="Loading"
                  isChecked={playground.isLoading}
                  onChange={playground.setIsLoading}
                />
              }
            />
            <ListGroup.Item
              title="Disabled"
              trailing={
                <Switch
                  label="Disabled"
                  isChecked={playground.isDisabled}
                  onChange={playground.setIsDisabled}
                />
              }
            />
          </ListGroup>
        </KitSection>

        <KitSection
          title="TerminalPanel"
          caption="Рамка 8 · экран 20 · фактура за текстом · три голоса"
        >
          <Switch
            label="Фактура экрана"
            isChecked={playground.isTextureEnabled}
            onChange={playground.setIsTextureEnabled}
          />
          {(
            [
              TERMINAL_VARIANT.KEEPER,
              TERMINAL_VARIANT.OVERSEER,
              TERMINAL_VARIANT.ADULT,
            ] as const
          ).map((variant) => (
            <TerminalPanel
              key={variant}
              variant={variant}
              isTextureEnabled={playground.isTextureEnabled}
              style={{ padding: SPACING.THREE, gap: SPACING.TWO }}
            >
              <Text
                variant="machine"
                themeColor={
                  variant === TERMINAL_VARIANT.OVERSEER
                    ? 'overseerLcd'
                    : 'phosphor'
                }
              >
                {variant === TERMINAL_VARIANT.KEEPER
                  ? '> хранитель на связи'
                  : variant === TERMINAL_VARIANT.OVERSEER
                    ? '// СМОТРИТЕЛЬ'
                    : '> служебный · взрослым'}
              </Text>
              <Text>
                Сначала — заряд. Остальное раздели между желаниями и целью.
              </Text>
              <Text variant="number">70 / 150</Text>
            </TerminalPanel>
          ))}
          <KitSection.Row label="size m · s, без LED-полосы">
            <View style={styles.stack}>
              <TerminalPanel size="m" isLampVisible={false} style={styles.pad}>
                <Text variant="machine">{'> период 3 · начало'}</Text>
                <Text variant="bodyBold">Составь план бюджета</Text>
              </TerminalPanel>
              <TerminalPanel size="s" style={styles.pad}>
                <Text variant="code" themeColor="textMuted">
                  ярус 1 / 5 · до подъёма 80
                </Text>
              </TerminalPanel>
            </View>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="TerminalDock"
          caption="Панель у нижнего края над игрой: по высоте содержимого, не выше maxShare. Screen presentation=sheet — то же для маршрутов"
        >
          <View style={styles.dockStage}>
            <TerminalDock maxShare={0.25}>
              <Text variant="machine">{'> диагностика'}</Text>
              <Text>{LONG_TITLE}</Text>
              <Text themeColor="textSecondary">{LONG_TITLE}</Text>
            </TerminalDock>
          </View>
        </KitSection>

        <KitSection
          title="ChamferCard"
          caption="Срезанный угол — подпись Смотрителя, в интерфейсе ребёнка его нет"
        >
          <KitSection.Row label="both — карточка испытания">
            <ChamferCard style={styles.fullWidth}>
              <Text variant="code" themeColor="overseerLcd">
                {'// ИСПЫТАНИЕ № 4 · ПЛАТЕЖИ'}
              </Text>
              <Text variant="bodyBold">Посчитай сдачу</Text>
            </ChamferCard>
          </KitSection.Row>
          <KitSection.Row label="topRight — реплика, тонированный фон">
            <ChamferCard
              variant="topRight"
              fillTone="overseerSurface"
              style={styles.fullWidth}
            >
              <Text>{LONG_TITLE}</Text>
            </ChamferCard>
          </KitSection.Row>
          <KitSection.Row label="недоступное — рамка гаснет">
            <ChamferCard borderTone="border" style={styles.fullWidth}>
              <Text themeColor="textSecondary">Сначала план</Text>
            </ChamferCard>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="ListGroup"
          caption="Одна мысль — одна рамка, тонкие линии между строками"
        >
          <ListGroup style={styles.fullWidth}>
            <ListGroup.Item
              title="Звук"
              subtitle="Щелчки и голоса ИИ"
              trailing={
                <Switch
                  isChecked={playground.isChecked}
                  onChange={playground.setIsChecked}
                  label="Звук"
                />
              }
            />
            <ListGroup.Item
              icon="clock"
              title="История"
              onPress={() => toast('История')}
            />
            <ListGroup.Item
              icon="book"
              title={LONG_TITLE}
              subtitle="Длинная строка переносится, шеврон остаётся"
              onPress={() => toast('Справочник')}
            />
            <ListGroup.Item
              title="Недоступная строка"
              disabled
              onPress={() => toast('—')}
            />
          </ListGroup>
        </KitSection>

        <KitSection
          title="Segmented"
          caption="Две-три вкладки, выбранная залита — нажми любую"
        >
          <Segmented
            options={[
              { value: 'need', label: 'Заряд', icon: 'battery' },
              { value: 'want', label: 'Модули', icon: 'gear' },
            ]}
            value={playground.segment === 'save' ? 'need' : playground.segment}
            onChange={playground.setSegment}
            style={styles.fullWidth}
          />
          <Segmented
            options={[
              { value: 'need', label: 'Периоды' },
              { value: 'want', label: 'Монеты' },
              { value: 'save', label: 'Испытания' },
            ]}
            value={playground.segment}
            onChange={playground.setSegment}
            style={styles.fullWidth}
          />
        </KitSection>

        <KitSection
          title="IllustratedBackdrop"
          caption="Фон: чистый и приглушённый для панелей."
        >
          <View style={styles.rings}>
            <IllustratedBackdrop
              source={require('../../../../assets/images/terminal-backdrop.jpg')}
            />
          </View>
          <View style={styles.rings}>
            <IllustratedBackdrop
              source={require('../../../../assets/images/terminal-backdrop.jpg')}
              variant="muted"
            />
          </View>
        </KitSection>
        <KitSection
          title="LoadingArtwork"
          caption="Настоящее ожидание, без выдуманных процентов."
        >
          <View style={{ height: 520, width: '100%' }}>
            <LoadingArtwork status="Готовим приключение" />
          </View>
        </KitSection>

        <KitSection
          title="RingsBackdrop"
          caption="pit — бетон ямы; surface — светлая поверхность в финале. Только декор."
        >
          <View style={styles.rings}>
            <RingsBackdrop centerY={0.62} />
          </View>
          <View style={styles.rings}>
            <RingsBackdrop variant="surface" centerY={1.3} />
          </View>
        </KitSection>

        <KitSection
          title="HintButton"
          caption="round — в шапке терминала, hud — висит на тросе над ямой"
        >
          <KitSection.Row label="round · hud" isInline>
            <HintButton screen="ui-kit" />
            <HintButton screen="ui-kit" variant="hud" />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="PixelIcon"
          caption="Единый набор из handoff · цвет задаётся семантическим тоном"
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SPACING.THREE,
            }}
          >
            {PIXEL_ICON_NAMES.map((name) => (
              <View
                key={name}
                style={{ alignItems: 'center', gap: SPACING.TWO, minWidth: 72 }}
              >
                <PixelIcon
                  name={name}
                  size={name === 'check20' ? 20 : 24}
                  tone={
                    name === 'coin'
                      ? 'coin'
                      : name === 'face'
                        ? 'overseerLcd'
                        : 'phosphor'
                  }
                />
                <Text variant="small">{name}</Text>
              </View>
            ))}
          </View>
          <KitSection.Row label="12 / 24 / 36 / 72" isInline>
            {[12, 24, 36, 72].map((size) => (
              <PixelIcon key={size} name="piggy" size={size} />
            ))}
          </KitSection.Row>
          <KitSection.Row label="phosphor / muted / coin / overseer" isInline>
            {(['phosphor', 'textMuted', 'coin', 'overseerLcd'] as const).map(
              (tone) => (
                <PixelIcon key={tone} name="heart" tone={tone} />
              ),
            )}
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="PixelArt"
          caption="Многоцветный пиксель-арт из строк · здесь — весь лист спрайтов игры"
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SPACING.THREE,
            }}
          >
            {SPRITE_NAMES.map((name) => (
              <View
                key={name}
                style={{ alignItems: 'center', gap: SPACING.TWO, minWidth: 72 }}
              >
                <PixelArt
                  rows={SPRITES[name]}
                  palette={SPRITE_PALETTE}
                  size={48}
                />
                <Text variant="small">{name}</Text>
              </View>
            ))}
          </View>
          <KitSection.Row label="16 / 32 / 40 / 96" isInline>
            {[16, 32, 40, 96].map((size) => (
              <PixelArt
                key={size}
                rows={SPRITES.coin}
                palette={SPRITE_PALETTE}
                size={size}
              />
            ))}
          </KitSection.Row>
          <KitSection.Row
            label="неизвестные чернила прозрачны · не квадратная сетка · пусто"
            isInline
          >
            <PixelArt rows={SPRITES.dogHead} palette={OUTLINE_ONLY} size={48} />
            <PixelArt
              rows={SPRITES.candy.slice(4, 12)}
              palette={SPRITE_PALETTE}
              size={48}
            />
            <PixelArt rows={[]} palette={SPRITE_PALETTE} size={48} />
          </KitSection.Row>
          <KitSection.Row label="сцены пазлов 48×48 — из тех же спрайтов">
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: SPACING.TWO,
              }}
            >
              {SCENE_NAMES.map((name) => (
                <PixelArt
                  key={name}
                  rows={PUZZLE_SCENES[name]}
                  palette={SPRITE_PALETTE}
                  size={96}
                />
              ))}
            </View>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Text"
          caption="Golos Text для чтения · Martian Mono для чисел"
        >
          {TEXT_VARIANTS.map((variant) => (
            <KitSection.Row key={variant} label={variant}>
              <Text variant={variant}>Съешь ещё этих булочек — 1 240</Text>
            </KitSection.Row>
          ))}

          <KitSection.Row label="themeColor перебивает цвет варианта">
            <Text variant="linkPrimary" themeColor="coin">
              Ссылка акцентным цветом
            </Text>
          </KitSection.Row>

          <KitSection.Row label="длинный текст в две строки">
            <Text numberOfLines={2}>{LONG_TITLE}</Text>
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Button"
          caption="6 вариантов × 4 размера, loading и disabled — сверху"
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

          <KitSection.Row
            label="icon · 48 dp · нажатие, loading, disabled"
            isInline
          >
            <Button
              variant="icon"
              accessibilityLabel="Уменьшить"
              disabled={playground.isDisabled}
              isLoading={playground.isLoading}
              onPress={() =>
                playground.setMeterValue(
                  Math.max(0, playground.meterValue - 0.1),
                )
              }
            >
              <PixelIcon name="minus" />
            </Button>
            <Button
              variant="icon"
              accessibilityLabel="Увеличить"
              disabled={playground.isDisabled}
              isLoading={playground.isLoading}
              onPress={() =>
                playground.setMeterValue(
                  Math.min(1, playground.meterValue + 0.1),
                )
              }
            >
              <PixelIcon name="plus" />
            </Button>
          </KitSection.Row>
          <KitSection.Row
            label={`stepper · 48 · ноль и максимум блокируют — ${playground.stepperValue}`}
            isInline
          >
            <Button
              variant="stepper"
              accessibilityLabel="Убрать 10"
              disabled={playground.isDisabled || playground.stepperValue <= 0}
              onPress={() =>
                playground.setStepperValue(
                  Math.max(0, playground.stepperValue - 10),
                )
              }
            >
              −
            </Button>
            <Button
              variant="stepper"
              accessibilityLabel="Добавить 10"
              disabled={playground.isDisabled || playground.stepperValue >= 50}
              onPress={() =>
                playground.setStepperValue(
                  Math.min(50, playground.stepperValue + 10),
                )
              }
            >
              +
            </Button>
          </KitSection.Row>
          <KitSection.Row label="длинная подпись">
            <Button isFullWidth onPress={() => toast('Сохранено')}>
              Сохранить распределение монет и вернуться к робопсу
            </Button>
          </KitSection.Row>
          <KitSection.Row label="Button.Label рядом с иконкой">
            <Button variant="primary" onPress={() => toast('Покупка')}>
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
              <Card.Title>Робопёс</Card.Title>
              <Card.Content>
                <Text themeColor="textSecondary">
                  Нажми на карточку — она станет выбранной.
                </Text>
              </Card.Content>
              <Card.Footer>
                <Button size="s" variant="ghost">
                  Позже
                </Button>
                <Button size="s">Зарядить</Button>
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

        <KitSection
          title="Chip"
          caption="9 вариантов: форма + слово, нажимаемый и статичный"
        >
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
          title="Input"
          caption="Подпись, счётчик, плейсхолдер и предел длины"
        >
          <KitSection.Row label="с подписью и счётчиком">
            <Input
              value={playground.inputValue}
              onChangeText={playground.setInputValue}
              placeholder="Имя робота"
              hint="Как зовут робота?"
              isCounterVisible
              maxLength={12}
              editable={!playground.isDisabled}
            />
          </KitSection.Row>

          <KitSection.Row label="warning / максимум / недоступно">
            <Input
              label="Имя робопса"
              variant="warning"
              hint="Используй только придуманное имя"
              value={playground.inputValue}
              onChangeText={playground.setInputValue}
              isCounterVisible
              maxLength={12}
            />
            <Input
              label="Максимальная длина"
              value="Двенадцать12"
              isCounterVisible
              maxLength={12}
              editable={false}
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
                <ListRow.Icon tone="surfaceSoft">
                  <Shape variant="leaf" size={22} color={theme.phosphor} />
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
          title="ProgressBar"
          caption="Значения за пределами 0…1 обрезаются"
        >
          <KitSection.Row label="0 / текущее / 1 / 2 (обрезано)">
            <ProgressBar value={0} />
            <ProgressBar value={playground.meterValue} color="primary" />
            <ProgressBar value={1} color="warning" />
            <ProgressBar value={2} color="warning" />
          </KitSection.Row>

          <KitSection.Row label="толщина и цвет дорожки">
            <ProgressBar value={0.4} height={4} />
            <ProgressBar value={0.4} height={20} trackColor="primarySoft" />
          </KitSection.Row>
        </KitSection>

        <KitSection
          title="Screen"
          caption="Этот экран и есть пример: фон, safe area, скролл и колонка по MAX_CONTENT_WIDTH. Screen.Footer — кнопки у низа, без сдвига при росте контента"
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
          <KitSection.Row label="Screen.Footer">
            <Screen.Footer style={styles.screenFooterDemo}>
              <Button size="l" isFullWidth>
                Начать период 2
              </Button>
              <Button variant="ghost" size="s" isFullWidth>
                без выбора
              </Button>
            </Screen.Footer>
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
                color={theme.warning}
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
              <Sheet.Label>подтверди</Sheet.Label>
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
          title="Sheet · warning"
          caption="Янтарная кромка и «!» — решение с ценой, никогда не красное"
        >
          <Sheet variant="warning" style={styles.fullWidth}>
            <Sheet.Label variant="warning">не хватает 20</Sheet.Label>
            <Sheet.Title>Большой аккумулятор стоит 90, у тебя 70</Sheet.Title>
            <Sheet.Actions>
              <Button variant="warning" size="m" isFullWidth>
                Удерживайте 2 секунды
              </Button>
              <Button size="m" isFullWidth>
                Отмена
              </Button>
            </Sheet.Actions>
          </Sheet>
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
              color="warning"
              onChange={(value) => playground.setMeterValue(value / 100)}
            />
          </KitSection.Row>

          <KitSection.Row label="узкий диапазон 0…1, шаг 0.1">
            <Slider
              value={playground.meterValue}
              min={0}
              max={1}
              step={0.1}
              color="primary"
              onChange={playground.setMeterValue}
            />
          </KitSection.Row>

          <KitSection.Row label="isThumbFilled — как на плане бюджета">
            <Slider
              value={playground.sliderValue}
              min={0}
              max={100}
              step={5}
              color="warning"
              isThumbFilled
              track={[theme.surface, theme.surfaceDeep, theme.warning]}
              onChange={playground.setSliderValue}
            />
          </KitSection.Row>

          <KitSection.Row label={`vertical — сейчас ${playground.sliderValue}`}>
            <View style={styles.verticalSliderRow}>
              <Slider
                orientation="vertical"
                value={playground.sliderValue}
                min={0}
                max={100}
                step={5}
                color="primary"
                isThumbFilled
                onChange={playground.setSliderValue}
                style={styles.verticalSlider}
              />
            </View>
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
              variant="primary"
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
          title="SplashOverlay"
          caption="Терминал включается над ямой — проигрывается по-настоящему"
        >
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
  loadingPreview: { height: 520, width: '100%' },
  dockStage: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderRadius: 14,
    height: 280,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  pad: { gap: SPACING.ONE, padding: SPACING.COMPACT },
  rings: {
    alignSelf: 'stretch',
    borderRadius: 14,
    height: 160,
    overflow: 'hidden',
  },
  screenFooterDemo: {
    paddingHorizontal: 0,
  },
  stack: { gap: SPACING.TWO, width: '100%' },
  swatch: {
    alignItems: 'center',
    borderRadius: SPACING.TWO,
    height: 56,
    justifyContent: 'center',
    width: 96,
  },
  verticalSliderRow: {
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
    width: '100%',
  },
  verticalSlider: {
    height: 180,
  },
});

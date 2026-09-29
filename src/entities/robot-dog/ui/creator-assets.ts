import type { RobotDogSkin } from '../model';
import type { RobotAssembly } from '../model/assembly';

const CREATOR_IMAGES = {
  factory: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/factory-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/factory-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/factory-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/factory-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/factory-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/factory-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/factory-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/factory-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/factory-radar-wide.jpg'),
    },
  },
  arctic: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/arctic-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/arctic-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/arctic-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/arctic-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/arctic-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/arctic-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/arctic-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/arctic-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/arctic-radar-wide.jpg'),
    },
  },
  carbon: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/carbon-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/carbon-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/carbon-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/carbon-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/carbon-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/carbon-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/carbon-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/carbon-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/carbon-radar-wide.jpg'),
    },
  },
  desert: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/desert-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/desert-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/desert-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/desert-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/desert-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/desert-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/desert-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/desert-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/desert-radar-wide.jpg'),
    },
  },
  forest: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/forest-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/forest-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/forest-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/forest-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/forest-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/forest-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/forest-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/forest-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/forest-radar-wide.jpg'),
    },
  },
  rescue: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/rescue-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/rescue-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/rescue-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/rescue-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/rescue-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/rescue-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/rescue-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/rescue-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/rescue-radar-wide.jpg'),
    },
  },
  rust: {
    floppy: {
      dots: require('../../../../assets/robot-dog/creator/rust-floppy-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/rust-floppy-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/rust-floppy-wide.jpg'),
    },
    blade: {
      dots: require('../../../../assets/robot-dog/creator/rust-blade-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/rust-blade-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/rust-blade-wide.jpg'),
    },
    radar: {
      dots: require('../../../../assets/robot-dog/creator/rust-radar-dots.jpg'),
      happy: require('../../../../assets/robot-dog/creator/rust-radar-happy.jpg'),
      wide: require('../../../../assets/robot-dog/creator/rust-radar-wide.jpg'),
    },
  },
} as const;

export const creatorImage = (skin: RobotDogSkin, assembly: RobotAssembly) =>
  CREATOR_IMAGES[skin][assembly.ears ?? 'floppy'][assembly.face ?? 'dots'];

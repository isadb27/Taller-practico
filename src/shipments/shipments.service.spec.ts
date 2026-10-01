import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const shipmentRulesServiceMock = {
    ensureCanBeDispatched: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(ShipmentEntity),
          useValue: repositoryMock,
        },
        {
          provide: ShipmentRulesService,
          useValue: shipmentRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ShipmentsService);
  });

  it('is defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  it('returns all shipments', async () => {
    // Arrange
    const shipments = [
      {
        id: 1,
        trackingCode: 'SHIP-001',
        destination: 'Bogotá',
        status: ShipmentStatus.CREATED,
      },
      {
        id: 2,
        trackingCode: 'SHIP-002',
        destination: 'Medellín',
        status: ShipmentStatus.DISPATCHED,
      },
    ] as ShipmentEntity[];

    repositoryMock.find.mockResolvedValue(shipments);

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toEqual(shipments);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  it('returns a shipment when the id exists', async () => {
    // Arrange
    const shipment = {
      id: 7,
      trackingCode: 'SHIP-007',
      destination: 'Barranquilla',
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(shipment);

    // Act
    const result = await service.findOne(7);

    // Assert
    expect(result).toEqual(shipment);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
  });

  it('throws NotFoundException when the id does not exist', async () => {
    // Arrange
    repositoryMock.findOneBy.mockResolvedValue(null);

    // Act and Assert
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates and saves a shipment', async () => {
    // Arrange
    const data = {
      trackingCode: 'SHIP-100',
      destination: 'Cali',
    };

    const builtShipment = {
      ...data,
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    const savedShipment = {
      id: 1,
      ...data,
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    repositoryMock.create.mockReturnValue(builtShipment);
    repositoryMock.save.mockResolvedValue(savedShipment);

    // Act
    const result = await service.create(data);

    // Assert
    expect(repositoryMock.create).toHaveBeenCalledWith({
      trackingCode: 'SHIP-100',
      destination: 'Cali',
      status: ShipmentStatus.CREATED,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(builtShipment);
    expect(result).toEqual(savedShipment);
  });

  it('dispatches and saves a valid shipment', async () => {
    // Arrange
    const shipment = {
      id: 3,
      trackingCode: 'SHIP-003',
      destination: 'Pereira',
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;

    const dispatchedShipment = {
      ...shipment,
      status: ShipmentStatus.DISPATCHED,
    } as ShipmentEntity;

    repositoryMock.findOneBy.mockResolvedValue(shipment);
    repositoryMock.save.mockResolvedValue(dispatchedShipment);

    // Act
    const result = await service.dispatch(3);

    // Assert
    expect(shipmentRulesServiceMock.ensureCanBeDispatched).toHaveBeenCalledWith(
      shipment,
    );
    expect(shipment.status).toBe(ShipmentStatus.DISPATCHED);
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 3,
        status: ShipmentStatus.DISPATCHED,
      }),
    );
    expect(result).toEqual(dispatchedShipment);
  });
});